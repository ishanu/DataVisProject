import pandas as pd
import os
import time
import numpy as np
from sklearn.manifold import TSNE


def total_cases(df):
    dct = {}
    total = df.groupby(['Offense_Type']).size()
    dct = total.to_dict()
    return dct

    
def get_sev_scores_from_csv(survey_df):
    dct = survey_df.loc[:, survey_df.columns != 'Survey_id'].mean().to_dict()
    return dct


def get_sev_score_from_response():
    # To be done later
    pass


def cases_by_individual_police(df):
    dct = {}
    officer_ids = df.groupby(['Officer_id']).size().index.values
    for off in officer_ids:
        new_df = df[df['Officer_id'] == off]
        offense_count = new_df.groupby(['Offense_Type']).size()
        offense_dct = offense_count.to_dict()
        dct[off] = offense_dct
    # print(dct)
    return dct


def calculate_individual_offense_score(sev_scores_dct, indiv_cases_dct):
    dct = {}
    for officer in indiv_cases_dct:
        offense_score = {}
        denom = 0
        for offense in indiv_cases_dct[officer]:
            num = sev_scores_dct[offense] * indiv_cases_dct[officer][offense]
            denom += num
            offense_score[offense] = num * 100
        for score in offense_score:
            offense_score[score] = float("{:.2f}".format(offense_score[score] / denom))
        dct[officer] = offense_score
    return dct


def calculate_individual_perf_score(sev_scores_dct, indiv_cases_dct, total_cases_dct):
    dct = {}
    for officer in indiv_cases_dct:
        num = 0
        denom = 0
        for offense in indiv_cases_dct[officer]:
            num += (sev_scores_dct[offense] * indiv_cases_dct[officer][offense])
            denom += (sev_scores_dct[offense] * total_cases_dct[offense])
        dct[officer] = float("{:.2f}".format((num * 100) / denom))
    return dct


def get_individual_metrics(offense_score, performance_score, indiv_cases_dct):
    dct = {}
    for officer in offense_score:
        temp = {"performance_score": performance_score[officer]}
        for offense in offense_score[officer]:
            temp[offense + "_score"] = offense_score[officer][offense]
            temp[offense + "_cases"] = indiv_cases_dct[officer][offense]
        dct[officer] = temp
    # print(dct)
    return dct


def individual_scores(df, sev_scores_dct):
    total_cases_dct = total_cases(df)
    indiv_cases_dct = cases_by_individual_police(df)
    offense_score = calculate_individual_offense_score(sev_scores_dct, indiv_cases_dct)
    performance_score = calculate_individual_perf_score(sev_scores_dct, indiv_cases_dct, total_cases_dct)
    individual_metrics_dct = get_individual_metrics(offense_score, performance_score, indiv_cases_dct) 
    return individual_metrics_dct


def tsne(officer_dct):
    # mnist = load_digits()
    # X = mnist.data / 255.0
    # y = mnist.target

    # print(X.shape, y.shape)
    # print(type(X), type(y))
    X = []
    y = []
    cols = []
    for officer in officer_dct:
        cols = list(officer_dct[officer].keys())
        X.append(list(officer_dct[officer].values()))
        y.append(str(officer))
    X = pd.DataFrame(X, columns=cols)
    y = np.array(y)
    X["Officer_id"] = y
    feat_columns = list(X.columns)
    feat_columns.remove("Officer_id")
    df_subset = X.copy()
    data_subset = df_subset[feat_columns].values
    # time_start = time.time()
    tsne = TSNE(n_components=2, verbose=0, perplexity=10, n_iter=300, init="pca", learning_rate=200.0)
    tsne_results = tsne.fit_transform(data_subset)

    # print('t-SNE done! Time elapsed: {} seconds'.format(time.time()-time_start))

    df_subset['tsne-2d-one'] = tsne_results[:,0]
    df_subset['tsne-2d-two'] = tsne_results[:,1]
    # print(df_subset)
    # plt.figure(figsize=(16,10))
    # sns.scatterplot(
    #     x="tsne-2d-one", y="tsne-2d-two",
    #     hue=y,
    #     palette=sns.color_palette("hls", 8),
    #     data=df_subset,
    #     legend="full",
    #     alpha=0.3
    # )
    # plt.show()
    return df_subset[["Officer_id", "tsne-2d-one", "tsne-2d-two"]]


def officer_locations(df):
    df = df[['Location', 'Officer_id']]
    df = df.drop_duplicates()
    locations = df.groupby(['Location']).size().index.values
    location_to_officer_dct = {}
    for l in locations:
        location_to_officer_dct[l] = list(df.loc[df['Location'] == l]["Officer_id"])
    # print(df.to_dict())
    return location_to_officer_dct


# if __name__ == '__main__':
#
#     survey_df = pd.read_csv(os.path.join('data','survey.csv'))
#     df = pd.read_csv(os.path.join('data','dataset.csv'))
#     sev_scores_dct = get_sev_scores_from_csv(survey_df)
    # total_cases(df)
    # cases_by_individual_police(df)
    # offense_score = calculate_individual_offense_score(get_sev_scores_from_csv(survey_df), cases_by_individual_police(df))
    # performance_score = calculate_individual_perf_score(get_sev_scores_from_csv(survey_df), cases_by_individual_police(df), total_cases(df))
    # get_individual_metrics(offense_score, performance_score)
    # final_dct = individual_scores(df, sev_scores_dct)
    # print(final_dct)
    # tsne(final_dct)
    # officer_locations(df)
