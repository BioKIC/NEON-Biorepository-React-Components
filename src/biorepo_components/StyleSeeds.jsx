import React from 'react';

import Accordion from '@material-ui/core/Accordion';
import AccordionActions from '@material-ui/core/AccordionActions';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Checkbox from '@material-ui/core/Checkbox';
import Divider from '@material-ui/core/Divider';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import IconButton from '@material-ui/core/IconButton';
import Link from '@material-ui/core/Link';
import Radio from '@material-ui/core/Radio';
import Slider from '@material-ui/core/Slider';
import Switch from '@material-ui/core/Switch';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';

import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';

import DownloadIcon from '@material-ui/icons/SaveAlt';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import InfoIcon from '@material-ui/icons/Info';
import LeftIcon from '@material-ui/icons/ChevronLeft';
import RightIcon from '@material-ui/icons/ChevronRight';

import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import Chip from '@material-ui/core/Chip';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import InputLabel from '@material-ui/core/InputLabel';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import TextField from '@material-ui/core/TextField';

import HomeIcon from '@material-ui/icons/Home';
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
      <IconButton size="small">
        <DownloadIcon />
      </IconButton>

      <IconButton>
        <DownloadIcon fontSize="small" />
      </IconButton>

      <IconButton>
        <DownloadIcon />
      </IconButton>

      <IconButton>
        <DownloadIcon fontSize="large" />
      </IconButton>

      <IconButton disabled>
        <DownloadIcon />
      </IconButton>

      {/* Slider */}
      <Slider
        defaultValue={30}
        min={0}
        max={100}
      />

      <Slider
        defaultValue={[30, 70]}
        min={0}
        max={100}
      />

      <Slider
        defaultValue={30}
        min={0}
        max={100}
        disabled
      />

      {/* Toggle Buttons */}
      <ToggleButtonGroup
        size="small"
        value="one"
      >
        <ToggleButton value="one">
          One
        </ToggleButton>
        <ToggleButton value="two">
          Two
        </ToggleButton>
      </ToggleButtonGroup>

      <ToggleButtonGroup value="one">
        <ToggleButton value="one">
          One
        </ToggleButton>
        <ToggleButton value="two">
          Two
        </ToggleButton>
      </ToggleButtonGroup>

      <ToggleButtonGroup
        size="large"
        value="one"
      >
        <ToggleButton value="one">
          One
        </ToggleButton>
        <ToggleButton value="two">
          Two
        </ToggleButton>
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

      <Link href="#" color="primary">
        Primary Link
      </Link>

      <Link href="#" underline="always">
        Underlined Link
      </Link>

      {/* Breadcrumbs */}
      <Breadcrumbs>
        <Link href="#">
          Home
        </Link>
        <Link href="#">
          Samples
        </Link>
        <Typography color="textPrimary">
          Current Page
        </Typography>
      </Breadcrumbs>

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
        label="Required Field"
        variant="outlined"
        required
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
