from flask import Flask, render_template, request, session, redirect, url_for
from flask_cors import CORS, cross_origin
from flask_restful import reqparse, Api, Resource
import os
import pandas as pd
import requests
import json
from calculations import *

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

app.secret_key = os.urandom(24)

data_dir = "data"
dataset_df = pd.read_csv(os.path.join(data_dir, "dataset.csv"))
survey_df = pd.read_csv(os.path.join(data_dir, "survey.csv"))
boston_df = pd.read_csv(os.path.join(data_dir, "Boston.csv"))
chicago_df = pd.read_csv(os.path.join(data_dir, "Chicago.csv"))
newyork_df = pd.read_csv(os.path.join(data_dir, "New York.csv"))
sanfrancisco_df = pd.read_csv(os.path.join(data_dir, "San Francisco.csv"))


def histogram_data(survey_df):
    larceny = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0}
    vandalism = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0}
    homicide = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0}
    drug_abuse = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0}
    assault = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0}
    for row in survey_df["Larceny"]:
        larceny[row] += 1
    for row in survey_df["Vandalism"]:
        vandalism[row] += 1
    for row in survey_df["Homicide"]:
        homicide[row] += 1
    for row in survey_df["Drug abuse"]:
        drug_abuse[row] += 1
    for row in survey_df["Assault"]:
        assault[row] += 1
    avg_sev_scores = get_sev_scores_from_csv(survey_df)
    return larceny, vandalism, homicide, drug_abuse, assault, avg_sev_scores


def performance_data_helper(sev_scores=None):
    if not sev_scores:
        sev_scores_dct = get_sev_scores_from_csv(survey_df)
    else:
        sev_scores_dct = sev_scores.copy()
    chicago_dct = individual_scores(chicago_df, sev_scores_dct)
    boston_dct = individual_scores(boston_df, sev_scores_dct)
    newyork_dct = individual_scores(newyork_df, sev_scores_dct)
    sanfrancisco_dct = individual_scores(sanfrancisco_df, sev_scores_dct)
    return chicago_dct, boston_dct, newyork_dct, sanfrancisco_dct


def scatterplot_data(sev_scores=None):
    chicago_dct, boston_dct, newyork_dct, sanfrancisco_dct = performance_data_helper(sev_scores)
    final_dct = chicago_dct.copy()
    final_dct.update(boston_dct)
    final_dct.update(newyork_dct)
    final_dct.update(sanfrancisco_dct)
    tsne_df = tsne(final_dct)
    location_to_officer_dct = officer_locations(dataset_df)
    return tsne_df, location_to_officer_dct


def heatmap_helper(loc_dct, location):
    perf_score_list = []
    offense_score_list = []
    for officer in loc_dct:
        perf_data = loc_dct[officer].copy()
        temp = {"id": str(officer), "location": location, "performance_score": perf_data["performance_score"], "normalized_performance_score": perf_data["performance_score"]}
        perf_score_list.append(temp)
        del(perf_data["performance_score"])
        for key in perf_data:
            if "_score" in key:
                t1 = {"id": str(officer), "location": location, "offense_score": perf_data[key], "offense_type": key.split("_")[0]}
                if t1["offense_score"] > 35:
                    t1["color"] = "#006d2c"
                elif 25 < t1["offense_score"] <= 35:
                    t1["color"] = "#31a354"
                elif 18 < t1["offense_score"] <= 25:
                    t1["color"] = "#74c476"
                elif 12 < t1["offense_score"] <= 18:
                    t1["color"] = "#a1d99b"
                elif 8 < t1["offense_score"] <= 12:
                    t1["color"] = "#c7e9c0"
                else:
                    t1["color"] = "#edf8e9"
                offense_score_list.append(t1)
    perf_scores_temp = sorted([elem["normalized_performance_score"] for elem in perf_score_list])
    temp_min, temp_max = perf_scores_temp[0] - 0.25, perf_scores_temp[-1] + 0.35
    for elem in perf_score_list:
        elem["normalized_performance_score"] = 1 + (elem["normalized_performance_score"] - temp_min) * (10 - 1) / (temp_max - temp_min)
        elem["normalized_performance_score"] = float("{:.2f}".format(elem["normalized_performance_score"]))
    perf_score_list = sorted(perf_score_list, key=lambda k: (k["location"], -k["normalized_performance_score"]))
    return perf_score_list, offense_score_list


def heatmap_data(sev_scores=None):
    chicago_dct, boston_dct, newyork_dct, sanfrancisco_dct = performance_data_helper(sev_scores)
    boston_perf_score_list, boston_offense_score_list = heatmap_helper(boston_dct, "Boston")
    chicago_perf_score_list, chicago_offense_score_list = heatmap_helper(chicago_dct, "Chicago")
    newyork_perf_score_list, newyork_offense_score_list = heatmap_helper(newyork_dct, "New York")
    sanfrancisco_perf_score_list, sanfrancisco_offense_score_list = heatmap_helper(sanfrancisco_dct, "San Francisco")
    final_perf_scores = boston_perf_score_list + chicago_perf_score_list + newyork_perf_score_list + sanfrancisco_perf_score_list
    final_offense_scores = boston_offense_score_list + chicago_offense_score_list + newyork_offense_score_list + sanfrancisco_offense_score_list
    return final_perf_scores, final_offense_scores


def any_helper_function():
    lst = [1, 2, 3]
    dct = {'a': 1, 'b': 2}
    intt = 12
    strr = "hello"
    return lst, dct, intt, strr


# @app.route("/", methods=["GET", "POST"])
# @cross_origin()
# def render_dashboard():
#     lst, dct, intt, strr = any_helper_function()
#     data_dir = "data"
#     df = pd.read_csv(os.path.join(data_dir, "dataset.csv"))
#     if request.method == "POST":
#         #do something
#         pass
#     else:
#         #do something else
#         pass
#     return render_template("index.html", var1=lst, var2=dct)

# ---------------------------------------------------------------------------------------------
#  API Work starts here.
api = Api(app)
datasets = {"Boston": boston_df, "Chicago": chicago_df, "New York": newyork_df,
                    "San Francisco": sanfrancisco_df}


class Histogram(Resource):
    def get(self):
        # args = parser.parse_args()
        larceny, vandalism, homicide, drug_abuse, assault, avg_sev_scores = histogram_data(survey_df)
        response = {"Larceny": larceny, "Vandalism": vandalism, "Homicide": homicide, "Drug abuse": drug_abuse,
                           "Assault": assault}
        for offense in avg_sev_scores:
            response[offense + "_average"] = float("{:.2f}".format(avg_sev_scores[offense]))
        return response, 200


class StackedRadar(Resource):
    def get(self, location):
        response = []
        cases_dct = cases_by_individual_police(datasets[location])
        for officer in cases_dct:
            temp = {"id": str(officer), "offense_details": []}
            for key in cases_dct[officer]:
                temp1 = {"offense_type": key, "offense_total": cases_dct[officer][key]}
                temp["offense_details"].append(temp1)
            response.append(temp)
        return response, 200


class Dandelion(Resource):
    def get(self):
        # args = parser.parse_args()
        response = {}
        maxx = -1
        for c in datasets:
            response[c] = []
            offense_list = total_cases(datasets[c])
            for key in offense_list:
                temp = {"offense_type": key, "offense_total": offense_list[key]}
                response[c].append(temp)
                maxx = max(maxx, offense_list[key])
        response["max_offense_total"] = maxx
        return response, 200


class Heatmap(Resource):
    def get(self):
        # args = parser.parse_args()
        response = {"offense_list": []}
        offense_list = total_cases(dataset_df)
        for o in offense_list:
            temp = {"offense_type": o, "total_cases": offense_list[o]}
            response["offense_list"].append(temp)
        response["offense_list"] = sorted(response["offense_list"], key=lambda k: (k["total_cases"]))
        perf_scores_list, offense_scores_list = heatmap_data()
        response["score_list"] = offense_scores_list
        response["officer_score"] = perf_scores_list
        return response, 200

    def put(self):
        updated_sev_scores = request.json
        response = {"offense_list": []}
        offense_list = total_cases(dataset_df)
        for o in offense_list:
            temp = {"offense_type": o, "total_cases": offense_list[o]}
            response["offense_list"].append(temp)
        response["offense_list"] = sorted(response["offense_list"], key=lambda k: (k["total_cases"]))
        perf_scores_list, offense_scores_list = heatmap_data(sev_scores=updated_sev_scores)
        response["score_list"] = offense_scores_list
        response["officer_score"] = perf_scores_list
        return response, 200


class Scatterplot(Resource):
    def get(self):
        # args = parser.parse_args()
        tsne_df, location_to_officer_dct = scatterplot_data()
        response = {}
        for location in location_to_officer_dct:
            if location not in response:
                response[location] = []
            officers = location_to_officer_dct[location]
            for officer in officers:
                response[location].append({"id": officer,
                                           "x": float("{:.2f}".format(
                                               list(tsne_df.loc[tsne_df["Officer_id"] == str(officer)]["tsne-2d-one"])[
                                                   0])),
                                           "y": float("{:.2f}".format(
                                               list(tsne_df.loc[tsne_df["Officer_id"] == str(officer)]["tsne-2d-two"])[
                                                   0]))
                                           })

        x_max, y_max = float("{:.2f}".format(max(list(tsne_df["tsne-2d-one"])))) + 10, \
                       float("{:.2f}".format(max(list(tsne_df["tsne-2d-two"])))) + 10
        x_min, y_min = float("{:.2f}".format(min(list(tsne_df["tsne-2d-one"])))) - 10, \
                       float("{:.2f}".format(min(list(tsne_df["tsne-2d-two"])))) - 10
        response["maxes"] = {"x_max": x_max, "y_max": y_max}
        response["mins"] = {"x_min": x_min, "y_min": y_min}
        return response, 200

    def put(self):
        updated_sev_scores = request.json
        tsne_df, location_to_officer_dct = scatterplot_data(sev_scores=updated_sev_scores)
        response = {}
        for location in location_to_officer_dct:
            if location not in response:
                response[location] = []
            officers = location_to_officer_dct[location]
            for officer in officers:
                response[location].append({"id": officer,
                                           "x": float("{:.2f}".format(
                                               list(tsne_df.loc[tsne_df["Officer_id"] == str(officer)]["tsne-2d-one"])[
                                                   0])),
                                           "y": float("{:.2f}".format(
                                               list(tsne_df.loc[tsne_df["Officer_id"] == str(officer)]["tsne-2d-two"])[
                                                   0]))
                                           })

        x_max, y_max = float("{:.2f}".format(max(list(tsne_df["tsne-2d-one"])))) + 10, \
                       float("{:.2f}".format(max(list(tsne_df["tsne-2d-two"])))) + 10
        x_min, y_min = float("{:.2f}".format(min(list(tsne_df["tsne-2d-one"])))) - 10, \
                       float("{:.2f}".format(min(list(tsne_df["tsne-2d-two"])))) - 10
        response["maxes"] = {"x_max": x_max, "y_max": y_max}
        response["mins"] = {"x_min": x_min, "y_min": y_min}
        return response, 200


class UpdateSeverity(Resource):
    def put(self):
        response = {}
        put_data = request.json
        url = "http://localhost:5000/api/{}"
        scatterplot_response = requests.put(url.format("scatterplot"), json=put_data)
        response["scatterplot"] = scatterplot_response.json()
        heatmap_response = requests.put(url.format("heatmap"), json=put_data)
        response["heatmap"] = heatmap_response.json()
        return response, 200


class Donut(Resource):
    def get(self, location):
        args = request.args
        offense = args["offense_type"]
        response = []
        cases_dct = cases_by_individual_police(datasets[location])
        sm = 0
        for officer in cases_dct:
            sm += cases_dct[officer][offense]
        for officer in cases_dct:
            percent = (cases_dct[officer][offense] * 100) // sm
            temp = {"id": str(officer), "offense_total": cases_dct[officer][offense], "offense_percent": percent}
            response.append(temp)
        return response, 200


api.add_resource(Heatmap, '/api/heatmap')
api.add_resource(Scatterplot, '/api/scatterplot')
api.add_resource(StackedRadar, '/api/stacked_radar/<location>')
api.add_resource(Dandelion, '/api/dandelion')
api.add_resource(Histogram, '/api/histogram')
api.add_resource(UpdateSeverity, '/api/update_severity')
api.add_resource(Donut, '/api/donut_chart/<location>')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
