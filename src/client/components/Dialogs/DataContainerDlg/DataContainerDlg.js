import PropTypes from 'prop-types'
import "./DataContainerDlg.scss"
import React from 'react'

export default class DataContainer extends React.Component{
    
    constructor(props){
        super(props)

        this.state = {
            itemsData:''
        }
    }

    get id(){
        return "Viewing.Extension.NewDataManagementExtension.DataContainer"
    }

    

    renderTitle(){
        return(
            <div className="data-title">
                <div className="data-title-name">资料详情</div>
                <div className="data-title-close" id="dataTitleClose"></div>
            </div>
        )
    }

    render(){
        // console.log("state的值是：》》》》》》》》》》》》》",this.react.getState())
        return (
            <div 
            className="data-content"
            >
            <div
            id="myDataContainer">
            
            </div>
            </div>
        )
    }
}