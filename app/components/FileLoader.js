import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Link } from 'react-router-dom';
import {
  Table,
  Icon,
  Header,
  Button,
  Segment,
  Message,
} from 'semantic-ui-react';
import styles from './FileLoader.scss';
import FileRow from './FileRow';
import DismissibleMessage from './common/DismissibleMessage';
import PageHeader from './common/PageHeader';
import FolderBrowser from './common/FolderBrowser';
import PageWrapper from './PageWrapper';

export default class FileLoader extends Component {
  state = {
    processedFiles: [],
    files: [],
    folders: {},
    rootFolderName: '',
    selectedFolderFullPath: '',
  }

  static propTypes = {
    // fileLoader actions
    loadRootFolder: PropTypes.func.isRequired,
    changeFolderSelection: PropTypes.func.isRequired,
    playFile: PropTypes.func.isRequired,
    storeScrollPosition: PropTypes.func.isRequired,
    deleteFile: PropTypes.func.isRequired,

    // game actions
    gameProfileLoad: PropTypes.func.isRequired,

    // error actions
    dismissError: PropTypes.func.isRequired,

    // store data
    history: PropTypes.object.isRequired,
    store: PropTypes.object.isRequired,
    errors: PropTypes.object.isRequired,
    globalNotifs: PropTypes.object.isRequired,
  };

  componentDidMount() {
    const xPos = _.get(this.props.store, ['scrollPosition', 'x']) || 0;
    const yPos = _.get(this.props.store, ['scrollPosition', 'y']) || 0;
    window.scrollTo(xPos, yPos);

    this.props.loadRootFolder();
  }

  componentWillUnmount() {
    this.props.storeScrollPosition({
      x: window.scrollX,
      y: window.scrollY,
    });

    // TODO: I added this because switching to the stats view was maintaining the scroll
    // TODO: position of this component
    // TODO: Might be better to do something as shown here:
    // TODO: https://github.com/ReactTraining/react-router/issues/2144#issuecomment-150939358
    window.scrollTo(0, 0);

    this.props.dismissError('fileLoader-global');
  }


  processFiles(files) {
    let resultFiles = files;

    resultFiles = resultFiles.filter(file => {
      if (file.hasError) {
        // This will occur if an error was encountered while parsing
        return false;
      }

      const settings = file.game.getSettings() || {};
      if (!settings.stageId) {
        // I know that right now if you play games from debug mode it make some
        // weird replay files... this should filter those out
        return false;
      }

      const metadata = file.game.getMetadata() || {};
      const totalFrames = metadata.lastFrame || 30 * 60 + 1;
      return totalFrames > 30 * 60;
    });

    resultFiles = _.orderBy(
      resultFiles,
      [
        file => {
          const metadata = file.game.getMetadata() || {};
          const startAt = metadata.startAt;
          return moment(startAt);
        },
        'fileName',
      ],
      ['desc', 'desc']
    );

    // Filter out files that were shorter than 30 seconds
    return resultFiles;
  }

  componentWillReceiveProps(nextProps) {
    const store = nextProps.store || {};
    const files = store.files || [];
    const processedFiles = this.processFiles(files);

    const folders = store.folders || {};
    const rootFolderName = store.rootFolderName || '';
    const selectedFolderFullPath = store.selectedFolderFullPath;

    this.setState({
      processedFiles,
      files,
      folders,
      rootFolderName,
      selectedFolderFullPath
    })
  }

  render() {
    return (
      <PageWrapper history={this.props.history}>
        <div className={styles['layout']}>
          <Sidebar
            folders={this.state.folders}
            rootFolderName={this.state.rootFolderName}
            selectedFolderFullPath={this.state.selectedFolderFullPath}
            globalNotifs={this.props.globalNotifs}
            changeFolderSelection={this.props.changeFolderSelection}
          />
          <div className="main-padding">
            <PageHeader
              icon="disk"
              text="Replay Browser"
              history={this.props.history}
            />
            <GlobalError
              propErrors={this.props.errors}
              dismissError={this.props.dismissError}
            />
            <FilteredFilesNotif
              files={this.state.files}
              processedFiles={this.state.processedFiles}
            />
            <FileRows
              processedFiles={this.state.processedFiles}
              playFile={this.props.playFile}
              deleteFile={() => this.deleteFile()}
              gameProfileLoad={this.props.gameProfileLoad}
              folders={this.state.folders}
              rootFolderName={this.state.rootFolderName}
            />
          </div>
        </div>
      </PageWrapper>
    );
  }
}

const Sidebar = ({ folders, rootFolderName, selectedFolderFullPath, globalNotifs, changeFolderSelection }) => {
  // Have to offset both the height and sticky position of the sidebar when a global notif is
  // active. Wish I knew a better way to do this.
  const globalNotifHeightPx = _.get(globalNotifs, ['activeNotif', 'heightPx']) || 0;
  const customStyling = {
    height: `calc(100vh - ${globalNotifHeightPx}px)`,
  };

  // We return a div that will serve as a placeholder for our column as well as a fixed
  // div for actually displaying the sidebar
  return [
    <div key="column-placeholder" />,
    <div key="sidebar" style={customStyling} className={styles['sidebar']}>
      <FolderBrowser
        folders={folders}
        rootFolderName={rootFolderName}
        selectedFolderFullPath={selectedFolderFullPath}
        changeFolderSelection={changeFolderSelection}
      />
    </div>,
  ];
}

const FilteredFilesNotif = ({ files, processedFiles }) => {
  const filteredFileCount = files.length - processedFiles.length;

  if (!filteredFileCount) {
    return null;
  }

  let contentText = 'Replays shorter than 30 seconds are automatically filtered.';

  const filesWithErrors = files.filter(file => file.hasError);
  const errorFileCount = filesWithErrors.length;
  if (errorFileCount) {
    contentText = `${errorFileCount} corrupt files detected. Non-corrupt replays shorter than 30 seconds are automatically filtered.`;
  }

  return (
    <Message
      info={true}
      icon="info circle"
      header={`${filteredFileCount} Files have been filtered`}
      content={contentText}
    />
  );
}

const GlobalError = ({ propErrors, dismissError }) => {
  const errors = propErrors || {};
  const errorKey = 'fileLoader-global';

  const showGlobalError = errors.displayFlags[errorKey] || false;
  const globalErrorMessage = errors.messages[errorKey] || '';
  return (
    <DismissibleMessage
      error={true}
      visible={showGlobalError}
      icon="warning circle"
      header="An error has occurred"
      content={globalErrorMessage}
      onDismiss={dismissError}
      dismissParams={[errorKey]}
    />
  );
}

const MissingRootFolder = () => {
  return (
    <div className={styles['empty-loader-content']}>
      <Header
        as="h2"
        icon={true}
        color="grey"
        inverted={true}
        textAlign="center"
      >
        <Icon name="folder outline" />
        <Header.Content>
          Root Folder Missing
          <Header.Subheader>
            Go to the settings page to select a root slp folder
          </Header.Subheader>
        </Header.Content>
      </Header>
      <Segment basic={true} textAlign="center">
        <Link to="/settings">
          <Button color="blue" size="large">
            Select Folder
          </Button>
        </Link>
      </Segment>
    </div>
  );
}

const EmptyLoader = ({ folders, rootFolderName }) => {
  if (!folders[rootFolderName]) {
    return <MissingRootFolder />;
  }

  return (
    <div className={styles['empty-loader-content']}>
      <Header
        as="h2"
        icon={true}
        color="grey"
        inverted={true}
        textAlign="center"
      >
        <Icon name="search" />
        <Header.Content>
          No Replay Files Found
          <Header.Subheader>
            Place slp files in the folder to browse
          </Header.Subheader>
        </Header.Content>
      </Header>
    </div>
  );
}

const FileRows = ({ processedFiles, playFile, deleteFile, gameProfileLoad, folders, rootFolderName }) => {
  // If we have no files to display, render an empty state
  if (!processedFiles.length) {
    return <EmptyLoader folders={folders} rootFolderName={rootFolderName} />
  }

  // Generate header row
  const headerRow = (
    <Table.Row>
      <Table.HeaderCell />
      <Table.HeaderCell>Details</Table.HeaderCell>
      <Table.HeaderCell>Time</Table.HeaderCell>
      <Table.HeaderCell />
    </Table.Row>
  );

  // Generate a row for every file in selected folder
  const rows = processedFiles.map(
    file => (
      <FileRow
        key={file.fullPath}
        file={file}
        playFile={playFile}
        deleteFile={deleteFile}
        gameProfileLoad={gameProfileLoad}
      />
    ),
    this
  );

  return (
    <Table
      className={styles['file-table']}
      basic="very"
      celled={true}
      inverted={true}
      selectable={true}
    >
      <Table.Header>{headerRow}</Table.Header>
      <Table.Body>{rows}</Table.Body>
    </Table>
  )
}
