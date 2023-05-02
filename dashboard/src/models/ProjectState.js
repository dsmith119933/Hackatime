import TimeRange from "./TimeRange";
import utils from "../utils.js";
import * as auth from "../auth";
import * as api from "../api";

/**
 * @typedef {Object} Project
 * @property {string} name
 * @property {string} desc
 * @property {number} totalSeconds
*/

const Model = {
  /** @type {Project[]} */
  projects: [],
  /** @type {Project?} */
  currentProject: null,
  dates: null,
  obj: null,
  clear: () => {
    Model.projects = null;
    Model.currentProject = null;
    Model.dates = null;
    Model.obj = null;
  },
  /** @param {Project[]} projects */
  initProjectList: projects => {
    Model.projects = _.orderBy(projects, ["totalSeconds", "name"], ["desc", "asc"])
      .filter(n => n.name !== "Other")
      .sort((a, b) => a.name.localeCompare(b.name));

    if (Model.projects.length > 0) {
      Model.currentProject = Model.projects[0];
    }

    Model.fetchProjectStats();
  },
  fetchProjectStats: (event, d1, d2) => {
    // If it was triggered by a click event.
    if (event) {
      event.redraw = false;
      Model.currentProject = event.target.innerHTML;
    }

    const start = new Date();
    const today = new Date();
    start.setDate(start.getDate() - TimeRange.numOfDays);

    Promise.all([
      api.getUserProjects({
        start: d1 || start.toISOString(),
        end: d2 || today.toISOString()
      }),
      api.getProject(Model.currentProject, {
        start: d1 || start.toISOString(),
        end: d2 || today.toISOString(),
        timeLimit: TimeRange.timeLimit
      })
    ])
      .then(function (values) {
        Model.projects = values[0].projects;
        Model.obj = values[1];
        Model.dates = utils.getDaysBetween(
          new Date(Model.obj.startDate),
          new Date(Model.obj.endDate)
        );
      })
      .catch(err =>
        auth.retryCall(err, () => Model.fetchProjectStats(event, d1, d2))
      );
  },
  fetchTagStats: tag => {
    api
      .getTagStats(tag, {
        start: TimeRange.start().toISOString(),
        end: TimeRange.end().toISOString(),
        timeLimit: TimeRange.timeLimit
      })
      .then(function (obj) {
        Model.obj = obj;
        Model.currentProject = `#${tag}`;
        Model.dates = utils.getDaysBetween(
          new Date(obj.startDate),
          new Date(obj.endDate)
        );
      })
      .catch(err => auth.retryCall(err, () => Model.fetchStats(tag)));
  },
  initialize: () => {
    api
      .getUserProjects({
        start: TimeRange.start().toISOString(),
        end: TimeRange.end().toISOString()
      })
      .then(function ({ projects }) {
        Model.initProjectList(projects);
      })
      .catch(function (err) {
        auth.retryCall(err, () => Model.initialize());
      });
  }
};

export default Model;
