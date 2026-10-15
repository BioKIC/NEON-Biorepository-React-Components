import React from 'react';

import Grid from '@mui/material/Grid';

import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import RightIcon from '@mui/icons-material/ChevronRight';

export default function BiorepoAboutSamplesContent() {
  return (
    <div id="callout-cards">
      <Grid container spacing={7}>
        <Grid item xs={6}>
          <Card variant="outlined">
            <CardMedia
              component="img"
              image="../images/card-images/1D8A2241.jpg"
              title="Collections"
              height="auto"
              loading="lazy"
            />
            <CardContent>
              <Typography variant="h5">
                Sample Types
              </Typography>
              <Typography variant="body2" color="textSecondary" component="p" style={{ fontSize: '1rem' }}>
                Explore the range of sample types archived at the Biorepository, including soils, organisms (whole and subsampled), and genomic extracts.
              </Typography>
            </CardContent>
            <CardActions>
              <Button variant="outlined" size="large" endIcon={<RightIcon />} href="../collections/misc/browsecollprofiles.php">
                View Samples Types
              </Button>
            </CardActions>
          </Card>
        </Grid>
        <Grid item xs={6}>
          <Card variant="outlined">
            <CardMedia
              component="img"
              image="../images/card-images/1D8A2197.jpg"
              title="Repositories"
              height="auto"
              loading="lazy"
            />
            <CardContent>
              <Typography variant="h5">
                Other Sample Repositories
              </Typography>
              <Typography variant="body2" color="textSecondary" component="p" style={{ fontSize: '1rem' }}>
                Although the NEON Biorepository is the primary facility housing NEON samples, select specimens are held by other institutions. Requests for these samples should be made directly to the hosting organization.
              </Typography>
            </CardContent>
            <CardActions>
              <Button variant="outlined" size="large" endIcon={<RightIcon />} href="https://www.neonscience.org/samples/sample-repositories">
                List of Repositories
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
}
