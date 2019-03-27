import React, { Component } from 'react';
import PropTypes from 'prop-types';
import PageWrapper from './PageWrapper';
import PageHeader from './common/PageHeader';

export default class Stream extends Component {
  static propTypes = {
    history: PropTypes.object.isRequired,
  }

  render() {
    return (
      <PageWrapper history={this.props.history}>
        <div className="main-padding">
          <PageHeader
            icon="twitch"
            text="Stream"
            history={this.props.history}
          />
          no u
          </div>
      </PageWrapper>
    )
  }
}
