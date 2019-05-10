class MyExtension extends Autodesk.Viewing.Extension {
  constructor( viewer, options ) {
      super( viewer, options );
  }

  load() {
      // 将背景颜色改成红色
      this.viewer.setBackgroundColor( 255, 0, 0, 255, 255, 255 );
      console.log('shareModel loaded');
      return true;
  }

  unload() {
      // 将背景颜色改回来 Viewer3D 自带的
      this.viewer.setBackgroundColor( 160,176,184, 190,207,216 );
      return true;
  }
}

// 将自订的扩展注册到 Viewer 的扩展管理员里，`DemoExtension` 是这个自订扩展独有的名字，
// 是在跟扩展管理员说我这个自订扩展叫做 `DemoExtension`，`Viewer3D` 也是透过这个名字来辨别要载入哪一个扩展的
Autodesk.Viewing.theExtensionManager.registerExtension( 'DemoExtension2', MyExtension );
