import axios from '../lib/axios.min.js';
import ko from './knockout-es.js';
import { formatAxiosError } from './helperFunctions.js';

function UploadViewModel(mainViewModel) {
  const self = this;
  let currentUploadId = 0;

  self.fileInputId = 'fileInput';
  self.currentUploads = ko.observableArray([]);
  self.uploadStatus = ko.observableArray([]);
  self.controller = new AbortController();

  self.onButtonClick = function() {
    if (self.currentUploads().length > 0) {
      self.controller.abort();
    } else {
      document.getElementById('fileInput').click()
    }
  }

  self.onFilesSelected = function(viewModel, event) {
    self.currentUploads.removeAll();
    self.uploadStatus.removeAll();
    self.controller = new AbortController();

    for (const file of event.target.files) {
      self.currentUploads.push(self.uploadFile(file));
    }

    Promise.allSettled(self.currentUploads()).then((results) => {
      self.currentUploads([]);
      if (results.every((result) => result.status === 'fulfilled')) {
        mainViewModel.showCatalogue();
      }
    });
  };

  self.updateUploadStatus = function(uploadInfo) {
    self.uploadStatus.replace(self.uploadStatus().find((ui) => ui.uploadId === uploadInfo.uploadId), { ...uploadInfo });
  }

  self.uploadFile = function(file) {
    const uploadUrl = '/api/MediaFiles/Upload';

    const uploadInfo = {
      uploadId: ++currentUploadId,
      fileName: file.name,
      uploadProgress: 0,
      uploadMessage: 'Uploading...',
      uploadError: null,
    }

    self.uploadStatus.push({ ...uploadInfo });

    return axios.post(uploadUrl, file, {
      signal: self.controller.signal,
      headers: { 'Content-Type': file.type },
      params: { fileName: file.name, fileLastModified: file.lastModified },
      onUploadProgress: function (progressEvent) {
        uploadInfo.uploadProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        self.updateUploadStatus(uploadInfo);
      },
    })
      .then(function (response) {
        uploadInfo.uploadProgress = 100;
        uploadInfo.uploadMessage = 'Upload successful!';
        self.updateUploadStatus(uploadInfo);
      })
      .catch(function (error) {
        uploadInfo.uploadProgress = 0;
        uploadInfo.uploadMessage = axios.isCancel(error) ? 'Upload cancelled' : `Upload failed: ${formatAxiosError(error)}`;
        uploadInfo.uploadError = error;
        self.updateUploadStatus(uploadInfo);
        return Promise.reject(error);
      });
  };
}

export default UploadViewModel;
