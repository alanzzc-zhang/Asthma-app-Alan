import { useState } from 'react'
import './App.css'
import Layout from './Layout'
import HomePage from './HomePage'
import Real_time_Tracking from './Real_time_Tracking'
import Explore_data from './Explore_Data'
//import Sample from './Sample'
//import LollipopChart from './Sample'
import SampleHeatMap from './SampleTwo'
import {
  BrowserRouter as Router,
  Routes,
  Route
} from 'react-router-dom'

function App() {
  

  return (
    <>
    <Router>
      <Routes>
          <Route path="/" element={<Layout/>}>
            <Route index element= {<HomePage/>}/>
            <Route path="/Real_Time_Tracking" element= {<Real_time_Tracking/>}/>
            <Route path="/Explore_Data" element= {<Explore_data/>}/>
            <Route path="/SampleTwo" element={<SampleHeatMap/>}/>
          </Route>
      </Routes>
    </Router>
    
      
    </>
  )
}

export default App
