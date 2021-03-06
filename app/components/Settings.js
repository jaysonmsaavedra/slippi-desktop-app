import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {
  Button,
  Message,
  Header,
} from 'semantic-ui-react';
import { getDefaultDolphinPath } from '../utils/settings';
import PageHeader from './common/PageHeader';
import ActionInput from './common/ActionInput';
import LabelDescription from './common/LabelDescription';
import DismissibleMessage from './common/DismissibleMessage';

import styles from './Settings.scss';
import PageWrapper from './PageWrapper';
import SpacedGroup from './common/SpacedGroup';

const { app } = require('electron').remote;

export default class Settings extends Component {
  static propTypes = {
    browseFolder: PropTypes.func.isRequired,
    selectFolder: PropTypes.func.isRequired,
    browseFile: PropTypes.func.isRequired,
    openDolphin: PropTypes.func.isRequired,

    // error actions
    dismissError: PropTypes.func.isRequired,

    // store data
    history: PropTypes.object.isRequired,
    store: PropTypes.object.isRequired,
    errors: PropTypes.object.isRequired,
  };

  setFolderManual = (field, value) => () => {
    this.props.selectFolder(field, value);
  };

  renderGlobalError() {
    const errors = this.props.errors || {};
    const errorKey = 'settings-global';

    const showGlobalError = errors.displayFlags[errorKey] || false;
    const globalErrorMessage = errors.messages[errorKey] || '';
    return (
      <DismissibleMessage
        className="bottom-spacer"
        error={true}
        visible={showGlobalError}
        icon="warning circle"
        header="An error has occurred"
        content={globalErrorMessage}
        onDismiss={this.props.dismissError}
        dismissParams={[errorKey]}
      />
    );
  }

  renderLinuxNotif() {
    const platform = process.platform;
    if (platform !== 'linux') {
      return null;
    }

    const contentMsg = (
      <div>
        Hello Linux friend! We cannot include a Dolphin build that is guaranteed
        to work on your distro. Please find the <b>Playback Dolphin Path</b>
        &nbsp;option to configure. <a href="https://discord.gg/KkhZQfR">Join the discord</a>
        &nbsp;if you have any questions.
      </div>
    );

    return (
      <Message
        info={true}
        icon="linux"
        header="Additional configuration necessary"
        content={contentMsg}
      />
    );
  }

  renderConfigDolphin() {
    return (
      <div>
        <LabelDescription
          label="Configure Playback Dolphin"
          description="
            The Dolphin used to play replay files is stored somewhere in the
            depths of your file system. This button will open that Dolphin for
            you so that you can change settings.
          "
        />
        <Button
          content="Configure Dolphin"
          color="green"
          size="medium"
          basic={true}
          inverted={true}
          onClick={this.props.openDolphin}
        />
      </div>
    );
  }

  renderBasicSettings() {
    const store = this.props.store || {};

    const inputs = [
      <ActionInput
        key="meleeISOInput"
        label="Melee ISO File"
        description="The path to a NTSC Melee 1.02 ISO. Used for playing replay files"
        value={store.settings.isoPath}
        onClick={this.props.browseFile}
        handlerParams={['isoPath']}
      />,
      <ActionInput
        key="replayRootInput"
        label="Replay Root Directory"
        description={
          'The folder where your slp files are stored. Will usually be the ' +
          'Slippi folder located with Dolphin'
        }
        value={store.settings.rootSlpPath}
        onClick={this.props.browseFolder}
        handlerParams={['rootSlpPath']}
      />,
    ];

    const platform = process.platform;
    if (platform === 'linux') {
      inputs.push([
        this.renderPlaybackInstanceInput(),
      ]);
    }

    return (
      <div className={styles['section']}>
        <Header inverted={true}>Basic Settings</Header>
        <SpacedGroup direction="vertical" size="lg">
          {inputs}
        </SpacedGroup>
      </div>
    );
  }

  renderAdvancedSettings() {
    const inputs = [];

    const platform = process.platform;
    if (platform !== 'linux') {
      inputs.push([
        this.renderPlaybackInstanceInput(),
      ]);
    }

    if (_.isEmpty(inputs)) {
      // Don't show advanced toggle if there are no
      // advanced inputs
      return null;
    }

    return (
      <div className={styles['section']}>
        <Header inverted={true}>Advanced Settings</Header>
        <SpacedGroup direction="vertical" size="lg">
          {inputs}
        </SpacedGroup>
      </div>
    );
  }

  renderPlaybackInstanceInput() {
    const store = this.props.store || {};
    
    const platform = process.platform;

    // If on Linux, indicate the steps required
    let playbackDolphinDescription = (
      <div>
        Linux users must build their own playback Dolphin instance
        <ul>
          <li>Use <a href="https://github.com/project-slippi/Slippi-FM-installer">installer script</a> to compile playback Dolphin</li>
          <li>Move the compiled instance out of the build directory</li>
          <li>Set the field below to point to the directory that contains dolphin-emu</li>
        </ul>
      </div>
    );

    const fieldName = 'playbackDolphinPath';
    let resetButton = null;

    // If not on Linux, indicate this shouldn't be messed with and set up
    // reset button
    if (platform !== 'linux') {
      playbackDolphinDescription = (
        <div>
          An instance of Dolphin for playing replays comes bundled
          with this app. This setting allows you to configure a different instance.&nbsp;
          <strong>Only modify if you know what you are doing.</strong>
        </div>
      );

      // Also if not on linux, support a button to reset the path
      const defaultValue = getDefaultDolphinPath();
      if (defaultValue !== store.settings.playbackDolphinPath) {
        resetButton = (
          <Button onClick={this.setFolderManual(fieldName, defaultValue)}>
            Reset
          </Button>
        );
      }
    }

    return (
      <div key="playbackInstanceInput">
        <LabelDescription
          label="Playback Dolphin Path"
          description={playbackDolphinDescription}
        />
        <SpacedGroup customColumns="1fr auto">
          <ActionInput
            showLabelDescription={false}
            value={store.settings.playbackDolphinPath}
            onClick={this.props.browseFolder}
            handlerParams={[fieldName]}
          />
          {resetButton}
        </SpacedGroup>
      </div>
    );
  }

  renderActions() {
    return (
      <div className={styles['section']}>
        <Header inverted={true}>Actions</Header>
        <SpacedGroup direction="vertical" size="lg">
          {this.renderConfigDolphin()}
        </SpacedGroup>
      </div>
    )
  }

  renderContent() {
    // TODO: Add options for file type filtering and folder only
    return (
      <div className={styles['container']}>
        {this.renderGlobalError()}
        {this.renderLinuxNotif()}
        {this.renderBasicSettings()}
        {this.renderAdvancedSettings()}
        {this.renderActions()}
      </div>
    );
  }

  render() {
    const currentVersion = app.getVersion();

    return (
      <PageWrapper history={this.props.history}>
        <div className="main-padding">
          <PageHeader
            icon="setting"
            text="Settings"
            infoText={`App v${currentVersion}`}
            history={this.props.history}
          />
          {this.renderContent()}
        </div>
      </PageWrapper>
    );
  }
}
