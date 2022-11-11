import React, { Component } from "react";

import classnames from "classnames";

import Loading from "./Loading";
import Panel from "./Panel";
import Axios from "axios";

import {
  getTotalInterviews,
  getLeastPopularTimeSlot,
  getMostPopularDay,
  getInterviewsPerDay
} from "helpers/selectors";
import { setInterview } from "helpers/reducers";


const data = [
  {
    id: 1,
    label: "Total Interviews",
    getValue: getTotalInterviews
  },
  {
    id: 2,
    label: "Least Popular Time Slot",
    getValue: getLeastPopularTimeSlot
  },
  {
    id: 3,
    label: "Most Popular Day",
    getValue: getMostPopularDay
  },
  {
    id: 4,
    label: "Interviews Per Day",
    getValue: getInterviewsPerDay
  }
];

class Dashboard extends Component {
  state = {
    days: [],
    appointments: {},
    interviewers: {},
    loading: true,
    focused: null
  };

  componentDidMount() {
    Promise.all([
      Axios.get('/api/days'),
      Axios.get('/api/appointments'),
      Axios.get('/api/interviewers')
    ]).then((all) => {
      this.setState(previous => ({
        ...previous,
        loading: false,
        days: all[0].data,
        appointments: all[1].data,
        interviewers: all[2].data
      }))
    })

    this.socket = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL);

    this.socket.onmessage = event => {
      const data = JSON.parse(event.data);
    
      if (typeof data === "object" && data.type === "SET_INTERVIEW") {
        this.setState(previousState =>
          setInterview(previousState, data.id, data.interview)
        );
      }
    };

    const focused = JSON.parse(localStorage.getItem("focused"));

    if (focused) {
      this.setState({ focused });
    }
  }

  componentDidUpdate(previousProps, previousState) {
    if (previousState.focused !== this.state.focused) {
      localStorage.setItem("focused", JSON.stringify(this.state.focused));
    }
  }
componentWillUnmount() {
  this.socket.close()
}


  render() {
    const dashboardClasses = classnames("dashboard", {
      "dashboard--focused": this.state.focused
    });

    if (this.state.loading) {
      return <Loading />;
    }


    return (<main className={dashboardClasses}>
      {(this.state.focused ? data.filter(panel => this.state.focused === panel.id) : data).map((item) => {
        return <Panel
          key={item.id}
          onClick={() => {
            if (this.state.focused) {
              this.setState({ focused: null })
            } else
              this.setState({ focused: item.id })
          }}
          value={item.getValue(this.state)}
          {...item}
        />
      })}
    </main>);
  }
}

export default Dashboard;
