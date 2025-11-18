import React, { useState, useEffect } from 'react';

import Grid from '@material-ui/core/Grid';

import Typography from '@material-ui/core/Typography';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';

import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import ExpandIcon from '@material-ui/icons/ExpandMore';
import Link from '@material-ui/core/Link';

function renderNode(nodes: any[], depth = 0) {
  return nodes.map((node, index) => {
    const isLastChild = index === nodes.length - 1;
    const collidLink = node.collid
      ? `../neon/checklists/checklist.php?clid=${node.collid}`
      : null;

    const nodeContent = collidLink ? (
      <Link href={collidLink} color="primary" underline="always" target="_self">
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
        <Accordion disabled={node.collid === 0}>
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

export default function BiorepoChecklistsContent() {
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
    <>
      <style>
        {`
          html, body {
            font-family: "Inter", Helvetica, Arial, sans-serif !important;
          }
        `}
      </style>

      <div id="callout-cards">
        <Grid container spacing={7}>
          <Grid item xs={4}>
            <Card variant="outlined">
              <CardMedia
                component="img"
                image="../images/card-images/IMG_9506.jpg"
                title="Repositories"
                height="auto"
                loading="lazy"
              />
              <CardContent>
                <Typography variant="h5" style={{ marginBottom: 20 }}>
                  Invertebrates
                </Typography>
                <div>
                  {renderNode(invertebrateNodesData)}
                </div>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card variant="outlined">
              <CardMedia
                component="img"
                image="../images/card-images/20210913NEONBioRepository_088.jpg"
                title="Repositories"
                height="auto"
                loading="lazy"
              />
              <CardContent>
                <Typography variant="h5" style={{ marginBottom: 20 }}>
                  Plants & Algae
                </Typography>
                <div>
                  {renderNode(plantNodesData)}
                </div>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card variant="outlined">
              <CardMedia
                component="img"
                image="../images/card-images/IMG_9530.jpg"
                title="Collections"
                height="auto"
                loading="lazy"
              />
              <CardContent>
                <Typography variant="h5" style={{ marginBottom: 20 }}>
                  Vertebrates
                </Typography>
                <div>
                  {renderNode(vertebrateNodesData)}
                </div>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </div>
    </>
  );
}
