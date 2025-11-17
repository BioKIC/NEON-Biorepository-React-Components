import React, { useState, useEffect } from 'react';

import PropTypes from 'prop-types';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import ExpandIcon from '@material-ui/icons/ExpandMore';
import Link from '@material-ui/core/Link';

function CustomTabPanel(props) {
  const {
    children, value, index, ...other
  } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

CustomTabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
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

function renderNode(nodes: any[], depth = 0) {
  return nodes.map((node, index) => {
    const isLastChild = index === nodes.length - 1;
    const collidLink = node.collid
      ? `neoncollprofiles.php?collid=${node.collid}`
      : null;

    const nodeContent = collidLink ? (
      <Link href={collidLink} target="_blank" rel="noopener noreferrer" color="primary" underline="always">
        <Typography color="inherit">{node.name}</Typography>
      </Link>
    ) : (
      <Typography>{node.name}</Typography>
    );

    return (
      <div
        key={node.id}
        style={{
          marginLeft: depth * 20,
          marginBottom: isLastChild ? 20 : 0,
        }}
      >
        <Accordion>
          {node.children ? (
            <AccordionSummary expandIcon={<ExpandIcon />}>
              {nodeContent}
            </AccordionSummary>
          ) : (
            <AccordionDetails>
              {nodeContent}
            </AccordionDetails>
          )}
          {node.children && renderNode(node.children, depth + 1)}
        </Accordion>
      </div>
    );
  });
}

export default function BiorepoCollectionsContent() {
  const [value, setValue] = React.useState(0);
  const [taxonomicNodesData, setTaxonomicNodes] = useState([]);
  const [sampletypeNodesData, setSampletypeNodes] = useState([]);
  const [protocolNodesData, setProtocolNodes] = useState([]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  useEffect(() => {
    fetch('../../neon-react/biorepo_lib/collections-taxonomic.json')
      .then((response) => response.json())
      .then((data) => {
        setTaxonomicNodes(data);
      })
      .catch((error) => console.error('Error loading nodes data:', error));
  }, []);

  useEffect(() => {
    fetch('../../neon-react/biorepo_lib/collections-protocol.json')
      .then((response) => response.json())
      .then((data) => {
        setSampletypeNodes(data);
      })
      .catch((error) => console.error('Error loading nodes data:', error));
  }, []);

  useEffect(() => {
    fetch('../../neon-react/biorepo_lib/collections-sampletype.json')
      .then((response) => response.json())
      .then((data) => {
        setProtocolNodes(data);
      })
      .catch((error) => console.error('Error loading nodes data:', error));
  }, []);

  return (
    <>
      <style>
        {`
          html, body {
            font-family: "Inter", Helvetica, Arial, sans-serif !important;
          }
        `}
      </style>

      <div>
        <Box sx={{ width: '100%' }}>
          <Typography variant="h3">
            Browse Sample Types
          </Typography>
          <Box sx={{ paddingTop: '30px', paddingBottom: '30px' }}>
            <Typography variant="body1">
              Use the tabs and dropdowns to explore the types of samples NEON offers, and view their data, records, and statistics.
            </Typography>
          </Box>
        </Box>
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={value}
              onChange={handleChange}
              textColor="primary"
              indicatorColor="primary"
              aria-label="collections-tabs"
              variant="fullWidth"
            >
              <Tab label="Organized by Taxonomic Group" {...a11yProps(0)} />
              <Tab label="Organized by Protocol" {...a11yProps(2)} />
              <Tab label="Organized by Preservation Method" {...a11yProps(1)} />
            </Tabs>
          </Box>
          <CustomTabPanel value={value} index={0}>
            <div>
              {renderNode(taxonomicNodesData)}
            </div>
          </CustomTabPanel>
          <CustomTabPanel value={value} index={2}>
            <div>
              {renderNode(protocolNodesData)}
            </div>
          </CustomTabPanel>
          <CustomTabPanel value={value} index={1}>
            <div>
              {renderNode(sampletypeNodesData)}
            </div>
          </CustomTabPanel>
        </Box>
      </div>
    </>
  );
}
