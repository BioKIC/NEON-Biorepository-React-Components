import React, { useState, useEffect } from 'react';

import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandIcon from '@mui/icons-material/ExpandMore';
import Button from '@mui/material/Button';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { makeStyles } from '../lib_components/components/Theme/makeStyles';
import { ThemeProvider } from '@mui/material/styles';
import Theme from '../lib_components/components/Theme/Theme';

const useStyles = makeStyles()((theme) => ({
  fullWidth: {
    width: '100%',
  },

  intro: {
    paddingTop: '30px',
    paddingBottom: '30px',
  },

  tabPanelContent: {
    padding: theme.spacing(3, 0),
  },

  node: {
    marginLeft: 48,
    marginBottom: 0,

    '& .MuiAccordion-root': {
      boxShadow: 'none',
      backgroundColor: 'transparent',
    
      '&, &.Mui-expanded, &:hover, &:active': {
        border: 'none',
      },
    
      '&:before': {
        display: 'none',
      },
    
      '&.Mui-expanded': {
        margin: 0,
      },
    },

    '& .MuiAccordionSummary-root': {
      minHeight: '64px',
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),

      '&.Mui-expanded': {
        minHeight: '64px',
      },
    },

    '& .MuiAccordionSummary-content': {
      margin: theme.spacing(2, 0),

      '&.Mui-expanded': {
        margin: theme.spacing(2, 0),
      },
    },

    '& .MuiAccordionDetails-root': {
      padding: theme.spacing(2),
    },
  },

  leafDetails: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    boxSizing: 'border-box',
    minHeight: '64px',
    padding: theme.spacing(2),
  },
}));

function CustomTabPanel(props) {
  const {
    children,
    value,
    index,
    classes,
    ...other
  } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box className={classes.tabPanelContent}>
          {children}
        </Box>
      )}
    </div>
  );
}

CustomTabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
  classes: PropTypes.shape({
    tabPanelContent: PropTypes.string.isRequired,
  }).isRequired,
};

CustomTabPanel.defaultProps = {
  children: PropTypes.string,
};

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

function RenderNode({
  node,
  depth,
  isLastChild,
  expandedNodes,
  handleAccordionChange,
  treeKey,
}) {
  const { classes } = useStyles({
    depth,
    isLastChild,
  });

  const hasChildren = node.children && node.children.length > 0;

  const nodeKey = `${treeKey}-${node.id}`;

  const collidLink = node.collid
    ? `neoncollprofiles.php?collid=${node.collid}`
    : null;

  const nodeContent = (
    <Typography>
      {node.name}
    </Typography>
  );

  return (
    <div className={classes.node}>
      <Accordion
        expanded={hasChildren ? !!expandedNodes[nodeKey] : false}
        onChange={
          hasChildren
            ? handleAccordionChange(nodeKey)
            : undefined
        }
      >
        {hasChildren ? (
          <AccordionSummary expandIcon={<ExpandIcon />}>
            {nodeContent}
          </AccordionSummary>
        ) : (
          <AccordionDetails className={classes.leafDetails}>
            <Typography>
              {node.name}
            </Typography>

            {collidLink && (
              <Button
                href={collidLink}
                color="primary"
                variant="outlined"
                size="medium"
                endIcon={<ChevronRightIcon />}
              >
                Explore Sample Type
              </Button>
            )}
          </AccordionDetails>
        )}

        {hasChildren
          && node.children.map((childNode, index) => (
            <RenderNode
              key={childNode.id}
              node={childNode}
              depth={depth + 1}
              isLastChild={index === node.children.length - 1}
              expandedNodes={expandedNodes}
              handleAccordionChange={handleAccordionChange}
              treeKey={treeKey}
            />
          ))}
      </Accordion>
    </div>
  );
}

RenderNode.propTypes = {
  node: PropTypes.shape({
    id: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]).isRequired,
    name: PropTypes.string.isRequired,
    collid: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    children: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.number,
        ]).isRequired,
        name: PropTypes.string.isRequired,
        collid: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.number,
        ]),
      }),
    ),
  }).isRequired,
  depth: PropTypes.number.isRequired,
  isLastChild: PropTypes.bool.isRequired,
  expandedNodes: PropTypes.objectOf(
    PropTypes.bool,
  ).isRequired,
  handleAccordionChange: PropTypes.func.isRequired,
  treeKey: PropTypes.string.isRequired,
};

function renderNodes(
  nodes,
  expandedNodes,
  handleAccordionChange,
  treeKey,
) {
  return nodes.map((node, index) => (
    <RenderNode
      key={node.id}
      node={node}
      depth={0}
      isLastChild={index === nodes.length - 1}
      expandedNodes={expandedNodes}
      handleAccordionChange={handleAccordionChange}
      treeKey={treeKey}
    />
  ));
}

export default function BiorepoCollectionsContent() {
  const { classes } = useStyles({
    depth: 0,
    isLastChild: false,
  });

  const [value, setValue] = useState(() => {
    const savedValue = localStorage.getItem('biorepoSelectedTab');

    return savedValue !== null
      ? Number(savedValue)
      : 0;
  });

  const [expandedNodes, setExpandedNodes] = useState(() => {
    const savedNodes = localStorage.getItem(
      'biorepoExpandedNodes',
    );

    return savedNodes
      ? JSON.parse(savedNodes)
      : {};
  });

  const [taxonomicNodesData, setTaxonomicNodes] = useState([]);
  const [sampletypeNodesData, setSampletypeNodes] = useState([]);
  const [protocolNodesData, setProtocolNodes] = useState([]);

  const handleChange = (event, newValue) => {
    setValue(newValue);

    localStorage.setItem(
      'biorepoSelectedTab',
      newValue,
    );
  };

  const handleAccordionChange = (nodeKey) => (
    event,
    isExpanded,
  ) => {
    setExpandedNodes((previous) => {
      const updated = {
        ...previous,
        [nodeKey]: isExpanded,
      };

      localStorage.setItem(
        'biorepoExpandedNodes',
        JSON.stringify(updated),
      );

      return updated;
    });
  };

  const cacheBust = `v=${Date.now()}`;

  useEffect(() => {
    fetch(
      `../../neon-react/biorepo_lib/collections-taxonomic.json?${cacheBust}`,
    )
      .then((response) => response.json())
      .then((data) => {
        setTaxonomicNodes(data);
      })
      .catch((error) => console.error(
        'Error loading nodes data:',
        error,
      ));
  }, []);

  useEffect(() => {
    fetch(
      `../../neon-react/biorepo_lib/collections-protocol.json?${cacheBust}`,
    )
      .then((response) => response.json())
      .then((data) => {
        setSampletypeNodes(data);
      })
      .catch((error) => console.error(
        'Error loading nodes data:',
        error,
      ));
  }, []);

  useEffect(() => {
    fetch(
      `../../neon-react/biorepo_lib/collections-sampletype.json?${cacheBust}`,
    )
      .then((response) => response.json())
      .then((data) => {
        setProtocolNodes(data);
      })
      .catch((error) => console.error(
        'Error loading nodes data:',
        error,
      ));
  }, []);

  return (
    <ThemeProvider theme={Theme}>
      <div>
        <Box className={classes.fullWidth}>
          <Typography variant="h3">
            Browse Sample Types
          </Typography>

          <Box className={classes.intro}>
            <Typography variant="body1">
              Use the tabs and dropdowns to explore the types of samples
              NEON offers
            </Typography>
          </Box>
        </Box>

        <Box className={classes.fullWidth}>
          <Box>
            <Tabs
              value={value}
              onChange={handleChange}
              textColor="primary"
              indicatorColor="primary"
              aria-label="collections-tabs"
              variant="fullWidth"
            >
              <Tab
                label="Organized by Taxonomic Group"
                {...a11yProps(0)}
              />

              <Tab
                label="Organized by Protocol"
                {...a11yProps(2)}
              />

              <Tab
                label="Organized by Preservation Method"
                {...a11yProps(1)}
              />
            </Tabs>
          </Box>

          <CustomTabPanel
            value={value}
            index={0}
            classes={classes}
          >
            <div>
              {renderNodes(
                taxonomicNodesData,
                expandedNodes,
                handleAccordionChange,
                'taxonomic',
              )}
            </div>
          </CustomTabPanel>

          <CustomTabPanel
            value={value}
            index={2}
            classes={classes}
          >
            <div>
              {renderNodes(
                protocolNodesData,
                expandedNodes,
                handleAccordionChange,
                'protocol',
              )}
            </div>
          </CustomTabPanel>

          <CustomTabPanel
            value={value}
            index={1}
            classes={classes}
          >
            <div>
              {renderNodes(
                sampletypeNodesData,
                expandedNodes,
                handleAccordionChange,
                'sampletype',
              )}
            </div>
          </CustomTabPanel>
        </Box>
      </div>
    </ThemeProvider>
  );
}
