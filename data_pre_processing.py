import pandas as pd
import os
import random
import numpy as np
import names

seen_ids = set()
seen_names = set()


def create_survey_ids(needed_num):
    seen = set()
    while len(seen) < needed_num:
        seen.add(str(random.randrange(100, 999)))
    return list(seen)


def create_ids(case_id):
    seen = set()
    while len(seen) < 1000:
        seen.add(case_id + str(random.randrange(100000, 999999)))
    return list(seen)


def create_off_ids(needed_num):
    seen = set()
    while len(seen) < needed_num:
        temp = str(random.randrange(100, 999))
        if temp not in seen_ids:
            seen.add(temp)
            seen_ids.add(temp)
    return list(seen)


def create_names(needed_num):
    seen = set()
    while len(seen) < needed_num:
        temp = names.get_full_name()
        if temp not in seen_names:
            seen.add(temp)
            seen_names.add(temp)
    return list(seen)


def create_df(case_id, location):
    cols = ['Case_Number', 'Offense_Code', 'Offense_Type', 'Arrest', 'Location', 'Officer_id', 'Officer_Name', 'Date']
    df = pd.DataFrame(columns=cols)
    case_no_list = create_ids(case_id)
    offense_list = ['Larceny', 'Vandalism', 'Homicide', 'Drug abuse', 'Assault']
    offense_code = ['1', '2', '3', '4', '5']
    arrest = ['Yes', 'No']
    dates = ['2000', '2001', '2002', '2003', '2004']
    officer_ids = create_off_ids(8)
    officer_names = create_names(8)

    offense_probabilities = {'Boston': [0.25, 0.2, 0.2, 0.1, 0.25], 'Chicago': [0.2, 0.17, 0.38, 0.09, 0.16], 'New York': [0.21, 0.43, 0.05, 0.18, 0.13], 'San Francisco': [0.45, 0.19, 0.08, 0.13, 0.15]}

    df['Offense_Type'] = np.random.choice(offense_list, size=1000, p=offense_probabilities[location])
    df['Location'] = location
    df['Case_Number'] = np.random.choice(case_no_list, size=1000)
    df['Arrest'] = np.random.choice(arrest, size=1000)
    df['Officer_Name'] = np.random.choice(officer_names, size=1000)
    df['Date'] = np.random.choice(dates, size=1000)
    for i in range(len(offense_code)):
        df.loc[df['Offense_Type'] == offense_list[i], 'Offense_Code'] = offense_code[i]
    for i in range(len(officer_names)):
        df.loc[df['Officer_Name'] == officer_names[i], 'Officer_id'] = officer_ids[i]
    return df


def survey(data_path):
    file_path = os.path.join(data_path, 'MetroVis_Survey_Survey_Student_Analysis_Report.csv')
    df = pd.read_csv(file_path, usecols=['14925348: Larceny', '14925350: Vandalism', '14925351: Homicide', '14925352: Drug abuse', '14925353: Assault'])
    df.rename(columns={'14925348: Larceny': "Larceny", '14925350: Vandalism': 'Vandalism', '14925351: Homicide': "Homicide", '14925352: Drug abuse': "Drug abuse", '14925353: Assault': "Assault"}, inplace=True)
    return df


if __name__ == "__main__":
    data_folder_path = 'data'

    case_id = ['BO', 'CH', 'NY', 'SF']
    location = ['Boston', 'Chicago', 'New York', 'San Francisco']
    for i in range(len(case_id)):
        df = create_df(case_id[i], location[i])
        df.to_csv(os.path.join(data_folder_path, location[i] + '.csv'), index=False)

    df1 = pd.read_csv(os.path.join(data_folder_path, location[0] + '.csv'))
    df2 = pd.read_csv(os.path.join(data_folder_path, location[1] + '.csv'))
    df3 = pd.read_csv(os.path.join(data_folder_path, location[2] + '.csv'))
    df4 = pd.read_csv(os.path.join(data_folder_path, location[3] + '.csv'))
    merged_df = pd.concat([df1, df2, df3, df4], ignore_index=True)
    merged_df = merged_df.sample(frac=1)
    merged_df.to_csv(os.path.join(data_folder_path, 'dataset.csv'), index=False)

    survey_df = survey(data_folder_path)
    survey_ids = create_survey_ids(survey_df.shape[0])
    survey_df["Survey_id"] = survey_ids
    survey_df.to_csv(os.path.join(data_folder_path, 'survey.csv'), index=False)

    print("Data preprocessing done! Datasets to be used placed in data -> survey.csv and dataset.csv")
