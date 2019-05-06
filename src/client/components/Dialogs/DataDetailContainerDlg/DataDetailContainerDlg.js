import PropTypes from 'prop-types'
import "./DataDetailContainerDlg.scss"
import React from 'react'

export default class DataDetailContainer extends React.Component{
    
    constructor(props){
        super(props)

        this.state = {
            itemsData:''
        }
    }

    get id(){
        return "Viewing.Extension.NewDataManagementExtension.DataDetailContainer"
    }

    

    renderTitle(){
        return(
            <div className="data-title">
                <div className="data-title-name">资料放大图</div>
                <div className="data-title-close" id="dataDetailTitleClose"></div>
            </div>
        )
    }

    render(){
        // console.log("state的值是：》》》》》》》》》》》》》",this.react.getState())
        return (
            <div 
            className="data-detail-content"
            >
            <div
            id="myDataDetailContainer">
            
            </div>
            </div>
        )
    }
}