import ko from './knockout-es.js';
import CatalogueViewModel from './catalogue.js';
import UploadViewModel from './upload.js';

function MainViewModel() {
  const self = this;

  const tabs = {
    catalogue: { name: 'catalogue' },
    upload: { name: 'upload' },
  }

  self.tabs = tabs;

  self.catalogueViewModel = new CatalogueViewModel(self);
  self.uploadViewModel = new UploadViewModel(self);

  self.activeTab = ko.observable(tabs.catalogue.name);

  self.showCatalogue = function (resetVideo) {
    if (resetVideo) self.catalogueViewModel.resetVideo();
    self.activeTab(tabs.catalogue.name);
    self.catalogueViewModel.getMediaFiles();
  }

  self.showUpload = function () {
    self.catalogueViewModel.pauseVideo();
    self.activeTab(tabs.upload.name);
  }

  self.showCatalogue();
}

ko.applyBindings(new MainViewModel());
