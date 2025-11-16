import axios from '../lib/axios.min.js';
import ko from './knockout-es.js';
import { utcDateToDateStr, formatAxiosError, fileSize } from './helperFunctions.js';

const sortByOptions = {
  name: { field: 'name', isDesc: false },
  ext: { field: 'ext', isDesc: false },
  lastModified: { field: 'lastModified', isDesc: true },
  size: { field: 'size', isDesc: true },
}

function CatalogueViewModel(mainViewModel) {
  const self = this;

  self.videoPlayerId = 'videoPlayer';
  self.mediaFiles = ko.observableArray([]);
  self.isLoading = ko.observable(true);
  self.loadingError = ko.observable(null);
  self.sortBy = ko.observable(sortByOptions.name.field);
  self.sortByDesc = ko.observable(sortByOptions.name.isDesc);
  self.activeVideoUrl = ko.observable('');

  const transformMediaFile = (mf) => {
    const lmDate = mf.lastModified ? new Date(mf.lastModified) : null;

    return {
      ...mf,
      lastModified: lmDate,
      lastModifiedStr: utcDateToDateStr(lmDate),
      sizeStr: fileSize(mf.size),
    };
  };

  const transformMediaFiles = (mediaFiles) => mediaFiles.map(transformMediaFile);

  const sortMediaFiles = (mediaFiles) =>
    mediaFiles.toSorted((a, b) => (
      a[self.sortBy()] < b[self.sortBy()]
        ? -1
        : a[self.sortBy()] > b[self.sortBy()]
          ? 1
          : 0
    ) * (self.sortByDesc() ? -1 : 1));

  self.sortTable = function(sortBy) {
    if (sortBy === self.sortBy()) {
      self.sortByDesc(!(self.sortByDesc()));
    } else {
      const options = sortByOptions[sortBy];
      self.sortBy(options.field);
      self.sortByDesc(options.isDesc);
    }
    self.mediaFiles(sortMediaFiles(self.mediaFiles()));
  }

  self.getMediaFiles = function() {
    const url = '/api/MediaFiles/ListMediaFiles';

    self.isLoading(true);

    axios.get(url)
      .then(function ({ data }) {
        self.mediaFiles(sortMediaFiles(transformMediaFiles(data)));
        self.isLoading(false);
      })
      .catch(function (error) {
        self.loadingError(error);
        self.isLoading(false);
      });
  };

  self.showLoadingError = () => formatAxiosError(self.loadingError());

  self.getVideoPlayer = () => document.getElementById(self.videoPlayerId);

  self.pauseVideo = function () {
    self.getVideoPlayer().pause();
  }

  self.resetVideo = function () {
    self.pauseVideo();
    self.getVideoPlayer().currentTime = 0;
    self.activeVideoUrl('');
  }

  self.playVideo = function(videoUrl) {
    self.resetVideo();
    self.activeVideoUrl(videoUrl);
    const videoPlayer = self.getVideoPlayer();
    videoPlayer.src = videoUrl;
    videoPlayer.play();
  }
}

export default CatalogueViewModel;
