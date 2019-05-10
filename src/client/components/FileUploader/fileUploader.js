/**
 * 文件上传
 */
import React, { Component } from 'react'
import ReactDOM from 'react-dom'

// 引用Upload File组件
import FileUpload from 'react-fileupload'
import './fileUploader.scss'
/**
 * 进度条组件
 */
function ProgressBar(props){
    return (
        <div>
            <div className="progress" style={{background:'#EDEDED',height:'11px',width: props.width + '%',borderRadius: '4px'}}>
                <div className="progress-bar" role="progressbar" aria-valuenow={props.width} aria-valuemin="0" aria-valuemax="100" style={{borderRadius: '4px 0 0 4px',width: props.width + '%'}} ></div>
            </div>
            <div className="progress">
                <div className="progress-bar" role="progressbar" aria-valuenow={props.width} aria-valuemin="0" aria-valuemax="100" style={{width: props.width + '%'}} >
                   {props.width}%
                </div>
            </div>
        </div>
   );
}

class UploadObject extends Component{
    constructor(props){
        super(props);
        this.options={
            baseUrl:  "http://localhost:8000/uploadfile/",
            dataType : 'json',
            // enctype: 'multipart/form-data',
            param:{
                bucket: 'bucketname',
                prefix: ''
           },
            chooseAndUpload : true,
            multiple: true,
            numberLimit: this.number_limit,
            fileFieldName: this.file_field_name,
            // paramAddToField : {purpose: 'save'},
            beforeChoose: this.before_choose,
            chooseFile: this.choose_file,
            beforeUpload: (files, mill) => {this.before_upload(files,mill);},
            doUpload: this.do_upload,
            onabort: this.onabort,
            uploading: (progress) => {this.uploading(progress);},
            uploadSuccess: this.upload_success,
            uploadError: this.uploadError,
            uploadFail: this.upload_fail
       }
       this.state = {
         choose: false //是否选择过文件
       }

        // 绑定
        this.render_progress_bar = this.render_progress_bar.bind(this);
        this.aborts = this.aborts.bind(this)
   }
    // 限制上传文件数
    number_limit(){
        return 5;
   }

    // 文件键值
    file_field_name(file){
        return file.name;
   }

    // 点击上传按钮前调用
    before_choose(){
        return true;
   }

    // 选择文件后调用
    choose_file(files){
        console.log(files);
        console.log('you choose',typeof files === 'string' ? files : files[0].name)
        this.setState({choose: true})
   }

    // 点击上传按钮前执行的操作
    before_upload(files,mill){
        // 检验上传文件的合法性
        let file_check = true;
        for(var i = 0; i < files.length; i++){
            const file = files[i];
            if(file.size > (500 * 1024 * 1024)) {
                // 文件过大
                console.log('"' + file.name + '"' + "超过" + 500 + "M");
                file_check = false;
                break;
           }
       }
        return file_check;
   }

    do_upload(files,mill,xhrID){
        //
   }

    // 在你主动取消一个xhr后触发
    onabort(mill,id){
      console.log('取消上传')
   }

   aborts () {
     if (this.state.choose) {
       this.refs['fileUpload'].abort()
     }
     console.log('取消')
     this.props.close()
   }

    // 在文件上传中的时候，浏览器会不断触发此函数，IE9-为虚拟的进度
    uploading(progress){
        //
        console.log(this);
        console.log('loading...', progress.loaded / progress.total + '%');
        console.log('ref',this.refs)
        this.render_progress_bar(parseInt(100 * (progress.loaded / progress.total)));
   }

    // 上传成功后执行的回调（针对AJAX而言）
    upload_success(resp){
        //
        if(resp.res === 0){
            // 上传成功
            console.log('上传成功');
            console.log(resp);
       }
   }
    //   上传错误后执行的回调（针对AJAX而言）
    upload_error(err){
        //
        console.log('上传错误');
        console.log(err);
   }

    upload_fail(resp){
        //
        console.log('上传失败');
        console.log(resp);
   }

    /**
     * 渲染进度条
     */
    render_progress_bar(width){
        ReactDOM.render(
            <ProgressBar width={width} />,
            document.getElementById('progerss-bar-id')
       );
   }

    componentDidMount(){
      // this.render_progress_bar();
   }

    render(){
        /*指定参数*/
        return(
            <div>
                <FileUpload options={this.options} ref="fileUpload">
                    <button ref="chooseAndUpload" className="btn btn-primary">上传文件</button>
                    <button className="btn btn-dangerous" onClick={this.aborts}>取消</button>
                </FileUpload>
            </div>
       );
   }
}

class UploadFile extends Component{
    render_upload_file(){
        ReactDOM.render(
            <UploadObject close={this.props.close}/>,
            document.getElementById('upload-file-id')
       );
   }
    componentDidMount(){
        this.render_upload_file();
   }

    render(){
        return(
            <div className="upload">
              <div id="upload-file-id"></div>
              <div id="progerss-bar-id"></div>
            </div>
       );
   }
}
export default UploadFile;
