import React, { Component } from 'react';
import { Provider } from 'electron-updater';
import { bindActionCreators } from 'redux';
import { dismissError } from '../actions/error';
import { connect } from 'react-redux';
import Stream from '../components/Stream';

function mapStateToProps(state) {
  return {
    store: state.game,
    errors: state.errors,
    globalNotifs: state.notifs,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    dismissError: dismissError,
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Stream);
