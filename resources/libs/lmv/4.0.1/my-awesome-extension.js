// Content for 'my-awesome-extension.js'

function MyAwesomeExtension(viewer, options) {
  Autodesk.Viewing.Extension.call(this, viewer, options);
}

MyAwesomeExtension.prototype = Object.create(Autodesk.Viewing.Extension.prototype);
MyAwesomeExtension.prototype.constructor = MyAwesomeExtension;

MyAwesomeExtension.prototype.load = function() {
  alert('MyAwesomeExtension is loaded!');
  return true;
};

MyAwesomeExtension.prototype.unload = function() {
  alert('MyAwesomeExtension is now unloaded!');
  return true;
};

Autodesk.Viewing.theExtensionManager.registerExtension('MyAwesomeExtension', MyAwesomeExtension);

//
var config3d = {
  extensions: ['MyAwesomeExtension']
};
viewerApp.registerViewer(viewerApp.k3D, Autodesk.Viewing.Private.GuiViewer3D, config3d);

MyAwesomeExtension.prototype.load = function() {
  // alert('MyAwesomeExtension is loaded!');

  var viewer = this.viewer;

  var lockBtn = document.getElementById('MyAwesomeLockButton');
  lockBtn.addEventListener('click', function() {
    viewer.setNavigationLock(true);
  });

  var unlockBtn = document.getElementById('MyAwesomeUnlockButton');
  unlockBtn.addEventListener('click', function() {
    viewer.setNavigationLock(false);
  });

  return true;
};

MyAwesomeExtension.prototype.lockViewport = function() {
  this.viewer.setNavigationLock(true);
};

MyAwesomeExtension.prototype.unlockViewport = function() {
  this.viewer.setNavigationLock(false);
};

MyAwesomeExtension.prototype.load = function() {
  // alert('MyAwesomeExtension is loaded!');

  this.onLockBinded = this.lockViewport.bind(this);
  this.onUnlockBinded = this.unlockViewport.bind(this);

  var lockBtn = document.getElementById('MyAwesomeLockButton');
  lockBtn.addEventListener('click', this.onLockBinded);

  var unlockBtn = document.getElementById('MyAwesomeUnlockButton');
  unlockBtn.addEventListener('click', this.onUnlockBinded);

  return true;
};

 MyAwesomeExtension.prototype.unload = function() {
  // alert('MyAwesomeExtension is now unloaded!');

  var lockBtn = document.getElementById('MyAwesomeLockButton');
  lockBtn.removeEventListener('click', this.onLockBinded);

  var unlockBtn = document.getElementById('MyAwesomeUnlockButton');
  unlockBtn.removeEventListener('click', this.onUnlockBinded);

  this.onLockBinded = null;
  this.onUnlockBinded = null;

  return true;
};


