import React, { useState, useEffect } from 'react';

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandIcon from '@mui/icons-material/ExpandMore';
import Link from '@mui/material/Link';

import { makeStyles } from '../lib_components/components/Theme/makeStyles';
import { ThemeProvider } from '@mui/material/styles';
import Theme from '../lib_components/components/Theme/Theme';

const useStyles = makeStyles()((theme) => ({
  root: {
    fontFamily: '"Inter", Helvetica, Arial, sans-serif',
  },

  accordion: {
    boxShadow: 'none',
    backgroundColor: 'transparent',

    '&, &.Mui-expanded, &:hover, &:active': {
      border: 'none',
    },

    '&::before': {
      display: 'none',
    },

    '&.Mui-expanded': {
      margin: 0,
    },

    '& .MuiAccordionSummary-root': {
      paddingLeft: 0,
      paddingRight: 0,
    },
    
    '& .MuiAccordionSummary-content': {
      minWidth: 0,
      overflowWrap: 'anywhere',
    },

    '& .MuiAccordionDetails-root': {
      paddingLeft: 0,
      paddingRight: 0,
    },
  },

  cardTitle: {
    marginBottom: 20,
  },
}));

function renderNode(nodes, classes, depth = 0) {
  return nodes.map((node, index) => {
    const isLastChild = index === nodes.length - 1;

    const collidLink = node.collid
      ? `../neon/checklists/checklist.php?clid=${node.collid}`
      : null;

    const nodeContent = collidLink ? (
      <Link
        href={collidLink}
        color="primary"
        underline="always"
        target="_self"
      >
        <Typography color="inherit">
          {node.name}
        </Typography>
      </Link>
    ) : (
      <Typography>
        {node.name}
      </Typography>
    );

    return (
      <div
        key={node.id}
        style={{
          marginLeft: depth * 20,
          marginBottom: isLastChild ? 20 : 0,
        }}
      >
        <Accordion
          className={classes.accordion}
          disabled={node.collid === 0}
        >
          {node.children ? (
            <AccordionSummary expandIcon={<ExpandIcon />}>
              {nodeContent}
            </AccordionSummary>
          ) : (
            <AccordionDetails>
              {nodeContent}
            </AccordionDetails>
          )}

          {node.children
            && renderNode(node.children, classes, depth + 1)}
        </Accordion>
      </div>
    );
  });
}

export default function BiorepoChecklistsContent() {
  const { classes } = useStyles();

  const [invertebrateNodesData, setInvertebrateNodes] = useState([]);
  const [vertebrateNodesData, setVertebrateNodes] = useState([]);
  const [plantNodesData, setPlantNodes] = useState([]);

  useEffect(() => {
    fetch('../neon-react/biorepo_lib/checklists-invertebrates.json')
      .then((response) => response.json())
      .then((data) => {
        setInvertebrateNodes(data);
      })
      .catch((error) => console.error('Error loading nodes data:', error));
  }, []);

  useEffect(() => {
    fetch('../neon-react/biorepo_lib/checklists-vertebrates.json')
      .then((response) => response.json())
      .then((data) => {
        setVertebrateNodes(data);
      })
      .catch((error) => console.error('Error loading nodes data:', error));
  }, []);

  useEffect(() => {
    fetch('../neon-react/biorepo_lib/checklists-plants.json')
      .then((response) => response.json())
      .then((data) => {
        setPlantNodes(data);
      })
      .catch((error) => console.error('Error loading nodes data:', error));
  }, []);

  return (
    <ThemeProvider theme={Theme}>
      <div id="callout-cards" className={classes.root}>
        <Grid container spacing={7}>
          <Grid size={4}>
            <Card variant="outlined">
              <CardMedia
                component="img"
                image="../images/card-images/IMG_9506.jpg"
                title="Repositories"
                height="auto"
                loading="lazy"
              />
              <CardContent>
                <Typography
                  variant="h5"
                  className={classes.cardTitle}
                >
                  Invertebrates
                </Typography>

                <div>
                  {renderNode(invertebrateNodesData, classes)}
                </div>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={4}>
            <Card variant="outlined">
              <CardMedia
                component="img"
                image="../images/card-images/20210913NEONBioRepository_088.jpg"
                title="Repositories"
                height="auto"
                loading="lazy"
              />
              <CardContent>
                <Typography
                  variant="h5"
                  className={classes.cardTitle}
                >
                  Plants & Algae
                </Typography>

                <div>
                  {renderNode(plantNodesData, classes)}
                </div>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={4}>
            <Card variant="outlined">
              <CardMedia
                component="img"
                image="../images/card-images/IMG_9530.jpg"
                title="Collections"
                height="auto"
                loading="lazy"
              />
              <CardContent>
                <Typography
                  variant="h5"
                  className={classes.cardTitle}
                >
                  Vertebrates
                </Typography>

                <div>
                  {renderNode(vertebrateNodesData, classes)}
                </div>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </div>
    </ThemeProvider>
  );
}