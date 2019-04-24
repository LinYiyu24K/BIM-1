import PropTypes from 'prop-types'
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

    }

    render(){
        // console.log("state的值是：》》》》》》》》》》》》》",this.react.getState())
        return (
            <div 
            className="dataContent"
            >
            <div
            id="myDataContainer">
            
            </div>
            </div>
        )
    }
}