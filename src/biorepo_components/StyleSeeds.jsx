import React from 'react';

import Accordion from '@mui/material/Accordion';
import AccordionActions from '@mui/material/AccordionActions';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Radio from '@mui/material/Radio';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import DownloadIcon from '@mui/icons-material/SaveAlt';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import LeftIcon from '@mui/icons-material/ChevronLeft';
import RightIcon from '@mui/icons-material/ChevronRight';

import Breadcrumbs from '@mui/material/Breadcrumbs';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';

import HomeIcon from '@mui/icons-material/Home';;
/*
 * Hidden component used to seed Material UI component styles.
 *
 * This ensures the application's bundled CSS contains the NEON theme
 * styles for commonly used Material UI components and variants.
 *
 * This component is never displayed to the user.
 */
export default function StyleSeeds() {
  return (
    <div
      aria-hidden="true"
      style={{ display: 'none' }}
    >
      {/* Accordion */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          Basic Accordion
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1">
            Accordion Details
          </Typography>
        </AccordionDetails>
        <AccordionActions>
          <Button>Cancel</Button>
          <Button color="primary">Action</Button>
        </AccordionActions>
      </Accordion>

      {/* Text Buttons */}
      <Button size="small">
        Text
      </Button>

      <Button size="medium">
        Text
      </Button>

      <Button size="large">
        Text
      </Button>

      <Button size="small" disabled>
        Text
      </Button>

      <Button size="medium" disabled>
        Text
      </Button>

      <Button size="large" disabled>
        Text
      </Button>

      {/* Outlined Buttons */}
      <Button
        variant="outlined"
        size="small"
        startIcon={<LeftIcon />}
      >
        Outlined
      </Button>

      <Button
        variant="outlined"
        size="medium"
        startIcon={<LeftIcon />}
      >
        Outlined
      </Button>

      <Button
        variant="outlined"
        size="large"
        startIcon={<LeftIcon />}
      >
        Outlined
      </Button>

      <Button
        variant="outlined"
        size="small"
        disabled
      >
        Outlined
      </Button>

      <Button
        variant="outlined"
        size="medium"
        disabled
      >
        Outlined
      </Button>

      <Button
        variant="outlined"
        size="large"
        disabled
      >
        Outlined
      </Button>

      {/* Contained Buttons */}
      <Button
        variant="contained"
        size="small"
        endIcon={<RightIcon />}
      >
        Contained
      </Button>

      <Button
        variant="contained"
        size="medium"
        endIcon={<RightIcon />}
      >
        Contained
      </Button>

      <Button
        variant="contained"
        size="large"
        endIcon={<RightIcon />}
      >
        Contained
      </Button>

      <Button
        variant="contained"
        size="small"
        disabled
      >
        Contained
      </Button>

      <Button
        variant="contained"
        size="medium"
        disabled
      >
        Contained
      </Button>

      <Button
        variant="contained"
        size="large"
        disabled
      >
        Contained
      </Button>

      {/* Button Groups */}
      <ButtonGroup size="small">
        <Button>One</Button>
        <Button>Two</Button>
      </ButtonGroup>

      <ButtonGroup>
        <Button>One</Button>
        <Button>Two</Button>
      </ButtonGroup>

      <ButtonGroup size="large">
        <Button>One</Button>
        <Button>Two</Button>
      </ButtonGroup>

      <ButtonGroup variant="text" size="small">
        <Button>One</Button>
        <Button>Two</Button>
      </ButtonGroup>

      <ButtonGroup variant="text">
        <Button>One</Button>
        <Button>Two</Button>
      </ButtonGroup>

      <ButtonGroup variant="text" size="large">
        <Button>One</Button>
        <Button>Two</Button>
      </ButtonGroup>

      {/* Cards */}
      <Card>
        <CardContent>
          <Typography variant="h5" component="h2">
            Card
          </Typography>

          <Typography
            variant="body2"
            color="textSecondary"
            component="p"
          >
            Card content
          </Typography>
        </CardContent>

        <CardActions>
          <Button variant="outlined">
            Action
          </Button>
        </CardActions>
      </Card>

      {/* Form Controls */}
      <FormControlLabel
        label="Checkbox"
        control={<Checkbox />}
      />

      <FormControlLabel
        label="Checkbox"
        control={<Checkbox checked />}
      />

      <FormControlLabel
        label="Checkbox"
        control={<Checkbox disabled />}
      />

      <FormControlLabel
        label="Radio"
        control={<Radio />}
      />

      <FormControlLabel
        label="Radio"
        control={<Radio checked />}
      />

      <FormControlLabel
        label="Radio"
        control={<Radio disabled />}
      />

      <FormControlLabel
        label="Switch"
        control={<Switch />}
      />

      <FormControlLabel
        label="Switch"
        control={<Switch checked />}
      />

      <FormControlLabel
        label="Switch"
        control={<Switch disabled />}
      />

      {/* Icon Buttons */}
      <IconButton color="primary" size="small">
        <DownloadIcon />
      </IconButton>
      
      <IconButton color="primary">
        <DownloadIcon fontSize="small" />
      </IconButton>
      
      <IconButton color="primary">
        <DownloadIcon />
      </IconButton>
      
      <IconButton color="primary">
        <DownloadIcon fontSize="large" />
      </IconButton>

      <IconButton disabled>
        <DownloadIcon />
      </IconButton>

      {/* Toggle Buttons */}
      {/* SMALL - One selected */}
      <ToggleButtonGroup size="small" value="one" exclusive>
        <ToggleButton value="one">One</ToggleButton>
        <ToggleButton value="two">Two</ToggleButton>
      </ToggleButtonGroup>
      
      {/* SMALL - Two selected */}
      <ToggleButtonGroup size="small" value="two" exclusive>
        <ToggleButton value="one">One</ToggleButton>
        <ToggleButton value="two">Two</ToggleButton>
      </ToggleButtonGroup>
      
      {/* MEDIUM - One selected */}
      <ToggleButtonGroup size="medium" value="one" exclusive>
        <ToggleButton value="one">One</ToggleButton>
        <ToggleButton value="two">Two</ToggleButton>
      </ToggleButtonGroup>
      
      {/* MEDIUM - Two selected */}
      <ToggleButtonGroup size="medium" value="two" exclusive>
        <ToggleButton value="one">One</ToggleButton>
        <ToggleButton value="two">Two</ToggleButton>
      </ToggleButtonGroup>
      
      {/* LARGE - One selected */}
      <ToggleButtonGroup size="large" value="one" exclusive>
        <ToggleButton value="one">One</ToggleButton>
        <ToggleButton value="two">Two</ToggleButton>
      </ToggleButtonGroup>
      
      {/* LARGE - Two selected */}
      <ToggleButtonGroup size="large" value="two" exclusive>
        <ToggleButton value="one">One</ToggleButton>
        <ToggleButton value="two">Two</ToggleButton>
      </ToggleButtonGroup>

      {/* Tooltip */}
      <Tooltip title="A basic tooltip">
        <IconButton aria-label="tooltip">
          <InfoIcon />
        </IconButton>
      </Tooltip>

      {/* Link */}
      <Link href="#">
        Link
      </Link>

      {/* Divider */}
      <Divider />

      {/* Typography */}
      <Typography variant="h1">
        Heading
      </Typography>

      <Typography variant="h2">
        Heading
      </Typography>

      <Typography variant="h3">
        Heading
      </Typography>

      <Typography variant="h4">
        Heading
      </Typography>

      <Typography variant="h5">
        Heading
      </Typography>

      <Typography variant="h6">
        Heading
      </Typography>

      <Typography variant="subtitle1">
        Subtitle
      </Typography>

      <Typography variant="subtitle2">
        Subtitle
      </Typography>

      <Typography variant="body1">
        Body
      </Typography>

      <Typography variant="body2">
        Body
      </Typography>

      <Typography variant="button">
        Button Text
      </Typography>

      <Typography variant="caption">
        Caption
      </Typography>

      <Typography variant="overline">
        Overline
      </Typography>

      {/* Tabs */}
      <Tabs value={0} indicatorColor="primary" textColor="primary">
        <Tab label="Tab One" />
        <Tab label="Tab Two" />
        <Tab label="Disabled" disabled />
      </Tabs>

      {/* Links */}
      <Link href="#">
        Standard Link
      </Link>

      {/* Lists */}
      <List>
        <ListItem>
          <ListItemText
            primary="List Item"
            secondary="Secondary text"
          />
        </ListItem>

        <ListItem button>
          <ListItemIcon>
            <HomeIcon />
          </ListItemIcon>
          <ListItemText primary="Clickable List Item" />
        </ListItem>

        <ListItem disabled>
          <ListItemText primary="Disabled List Item" />
        </ListItem>
      </List>

      {/* Text Fields */}
      <TextField
        label="Text Field"
        variant="outlined"
      />

      <TextField
        label="Disabled Field"
        variant="outlined"
        disabled
      />

      <TextField
        label="Error Field"
        variant="outlined"
        error
        helperText="There is an error."
      />

      <TextField
        label="Multiline Field"
        variant="outlined"
        multiline
        rows={3}
      />

      {/* Select */}
      <FormControl variant="outlined">
        <InputLabel>Sample Type</InputLabel>

        <Select
          value=""
          label="Sample Type"
        >
          <MenuItem value="">
            None
          </MenuItem>
          <MenuItem value="one">
            One
          </MenuItem>
          <MenuItem value="two">
            Two
          </MenuItem>
        </Select>

        <FormHelperText>
          Select a sample type
        </FormHelperText>
      </FormControl>

      {/* Chips */}
      <Chip label="Default Chip" />

      <Chip
        label="Primary Chip"
        color="primary"
      />

      <Chip
        label="Outlined Chip"
        color="primary"
        variant="outlined"
      />
    </div>
  );
}
