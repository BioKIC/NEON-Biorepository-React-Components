import React, { useEffect, useState } from 'react';

import {
  makeStyles,
  ThemeProvider,
} from '@material-ui/core/styles';

import Accordion from '@material-ui/core/Accordion';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import LinearProgress from '@material-ui/core/LinearProgress';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import Link from '@material-ui/core/Link';
import LinkIcon from '@material-ui/icons/Link';

import GetAppIcon from '@material-ui/icons/GetApp';
import DescriptionOutlinedIcon from '@material-ui/icons/DescriptionOutlined';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import InfoIcon from '@material-ui/icons/Info';
import SubdirectoryArrowRightIcon from '@material-ui/icons/SubdirectoryArrowRight';

import Theme from '../lib_components/components/Theme/Theme';

const useStyles = makeStyles((theme) => ({
  card: {
    padding: theme.spacing(4),
    width: '100%',
    boxSizing: 'border-box',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing(3),
    gap: theme.spacing(2),
  },

  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },

  title: {
    fontWeight: 700,
  },

  subtitle: {
    maxWidth: 900,
  },

  showAllButton: {
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: theme.palette.primary.main,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    fontSize: '1rem',
  },

  accordion: {
    '&.MuiAccordion-root': {
      border: 'none',
    },
  },

  accordionSummary: {
    paddingLeft: 0,
    paddingRight: 0,
    minHeight: 'unset',
    '&.Mui-expanded': {
      minHeight: 'unset',
    },
    '& .MuiAccordionSummary-content': {
      margin: `${theme.spacing(2)}px 0`,
    },
    '& .MuiAccordionSummary-content.Mui-expanded': {
      margin: `${theme.spacing(2)}px 0`,
    },
  },

  accordionDetails: {
    display: 'block',
    paddingTop: 0,
    paddingLeft: theme.spacing(5),
    paddingRight: 0,
    paddingBottom: theme.spacing(2),
  },

  familyRow: {
    width: '100%',
  },

  familyTopRow: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: theme.spacing(2),
    alignItems: 'center',
    marginBottom: theme.spacing(1),
  },

  familyLabel: {
    fontWeight: 700,
  },

  totalLabel: {
    whiteSpace: 'nowrap',
    fontWeight: 600,
  },

  progressRoot: {
    height: 8,
    borderRadius: 999,
    backgroundColor: theme.palette.grey[200],
  },

  subtypeRow: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: theme.spacing(2),
    alignItems: 'center',
    padding: `${theme.spacing(1)}px 0`,
  },

  subtypeLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
  },

  subtypeDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    flexShrink: 0,
  },

  footer: {
    marginTop: theme.spacing(3),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },

  protocolRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1.5),
    gap: theme.spacing(2),
  },

  protocolMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    minWidth: 0,
    flexWrap: 'wrap',
  },

  protocolIcon: {
    color: theme.palette.text.secondary,
    fontSize: 22,
  },

  protocolDivider: {
    width: 1,
    height: 18,
    backgroundColor: theme.palette.grey[300],
  },

  protocolText: {
    color: theme.palette.text.secondary,
  },

  footerButton: {
    marginBottom: theme.spacing(1),
  },

  footerTotal: {
    marginTop: theme.spacing(1),
  },

  subtypeRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(1, 2),
    borderRadius: 4,
    '&:hover': {
      backgroundColor: '#0073cf08',
    },
  },

  subtypeIconLink: {
    display: 'flex',
    alignItems: 'center',
    marginRight: theme.spacing(1),
    color: theme.palette.primary.main,
  },

  subtypeLinkIcon: {
    fontSize: 16,
  },

  subtypeNameLink: {
    color: 'inherit !important',
    textDecoration: 'none !important',

    '&:hover': {
      color: 'inherit !important',
      textDecoration: 'none !important',
    },

    '&:visited': {
      color: 'inherit !important',
    },

    '&:active': {
      color: 'inherit !important',
    },
  },

  subtypeCount: {
    minWidth: 180,
    textAlign: 'right',
    flexShrink: 0,
  },
}));

export default function CollectionTypeSummary() {
  const classes = useStyles(Theme);

  const [showAll, setShowAll] = useState(false);

  const [protocolMap, setProtocolMap] = useState({});

  const sampleTypes = React.useMemo(() => {
    const data = window.biorepoCollectionTypeSummary || [];
    return [...data].sort((a, b) => b.total - a.total);
  }, []);

  const totalRecords = window.biorepoCollectionTypeSummaryTotal || 0;

  useEffect(() => {
    const fetchProtocols = async () => {
      const response = await fetch(
        'https://data.neonscience.org/api/v0/documents',
      );

      const json = await response.json();

      const protocols = {};

      sampleTypes.forEach((family) => {
        const familyCode = family.family
          .split('–')[0]
          .trim();

        const match = json.data.find((doc) => {
          if (!doc.description) {
            return false;
          }

          if (family.family === 'TIS Soil Pit Sampling Protocol') {
            return doc.description === 'TIS Soil Pit Sampling Protocol';
          }

          return (
            doc.description.includes(
              'Protocol and Procedure',
            )
            && doc.description.includes(familyCode)
          );
        });

        if (match) {
          protocols[family.family] = {
            name: match.name,
            size: match.size,
            url: `https://data.neonscience.org/api/v0/documents/${match.name}`,
          };
        }

        if (family.family.includes('FSL')) {
          const fssMatch = json.data.find((doc) => {
            if (!doc.description) {
              return false;
            }

            return (
              doc.description.includes(
                'Protocol and Procedure',
              )
              && doc.description.includes('FSS')
            );
          });

          if (fssMatch) {
            protocols[`${family.family}_FSS`] = {
              name: fssMatch.name,
              size: fssMatch.size,
              url: `https://data.neonscience.org/api/v0/documents/${fssMatch.name}`,
            };
          }
        }

        if (family.family.includes('Neon Tower/Sensor Protocols')) {
          const wetDepMatch = json.data.find((doc) => {
            if (!doc.description) {
              return false;
            }

            return doc.description.includes(
              'NEON Sensor Command, Control, and Configuration (C3) Document: Wet Deposition',
            );
          });

          if (wetDepMatch) {
            protocols[`${family.family}_WETDEP`] = {
              name: wetDepMatch.name,
              size: wetDepMatch.size,
              url: `https://data.neonscience.org/api/v0/documents/${wetDepMatch.name}`,
            };
          }

          const particulateMatch = json.data.find((doc) => {
            if (!doc.description) {
              return false;
            }

            return doc.description.includes(
              'NEON Sensor Command, Control and Configuration (C3) Document: Particulate Analyzer - Mass',
            );
          });

          if (particulateMatch) {
            protocols[`${family.family}_PARTICULATE`] = {
              name: particulateMatch.name,
              size: particulateMatch.size,
              url: `https://data.neonscience.org/api/v0/documents/${particulateMatch.name}`,
            };
          }
        }
      });

      setProtocolMap(protocols);
    };

    fetchProtocols();
  }, [sampleTypes]);

  const visibleTypes = showAll
    ? sampleTypes
    : sampleTypes.slice(0, 3);

  const formatNumber = (value) => (
    Number(value || 0).toLocaleString()
  );

  return (
    <ThemeProvider theme={Theme}>
      <div style={{ display: 'none' }}>
        <Button variant="outlined" color="primary">
          Style Seed
        </Button>
      </div>
      <Card className={classes.card}>
        <div className={classes.header}>
          <div>
            <div className={classes.titleRow}>
              <Typography
                variant="h5"
                component="h2"
                className={classes.title}
              >
                Sample Type Summary
              </Typography>

              <Tooltip
                title="Summary of records grouped by protocol and sample type."
                interactive
              >
                <IconButton size="small">
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </div>

            <Typography
              variant="body1"
              className={classes.subtitle}
            >
              Records are grouped by protocol and sample type.
            </Typography>
          </div>
        </div>

        <Divider />

        {visibleTypes.map((family) => {
          const color = Theme.palette.primary.main;

          return (
            <Accordion
              key={family.family}
              className={classes.accordion}
              defaultExpanded={family === visibleTypes[0]}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                className={classes.accordionSummary}
              >
                <div className={classes.familyRow}>
                  <div className={classes.familyTopRow}>
                    <Typography
                      variant="subtitle1"
                      className={classes.familyLabel}
                    >
                      {family.family}
                    </Typography>

                    <Typography
                      variant="body1"
                      className={classes.totalLabel}
                    >
                      {`${formatNumber(family.total)} Samples (${family.percent}%)`}
                    </Typography>
                  </div>

                  {protocolMap[family.family] && (
                    <>
                      <div className={classes.protocolRow}>
                        <div className={classes.protocolMeta}>
                          <DescriptionOutlinedIcon
                            className={classes.protocolIcon}
                          />
                          <div className={classes.protocolDivider} />
                          <Typography
                            variant="body2"
                            className={classes.protocolText}
                          >
                            {protocolMap[family.family].name.replace(
                              '.pdf',
                              '',
                            )}
                          </Typography>
                        </div>
                        <Button
                          variant="outlined"
                          color="primary"
                          size="small"
                          startIcon={<GetAppIcon />}
                          href={protocolMap[family.family].url}
                          target="_blank"
                        >
                          Download Protocol
                        </Button>
                      </div>
                      {protocolMap[
                        `${family.family}_HBP`
                      ] && (
                        <div className={classes.protocolRow}>
                          <div className={classes.protocolMeta}>
                            <DescriptionOutlinedIcon
                              className={classes.protocolIcon}
                            />
                            <div className={classes.protocolDivider} />
                            <Typography
                              variant="body2"
                              className={classes.protocolText}
                            >
                              {protocolMap[
                                `${family.family}_HBP`
                              ].name.replace(
                                '.pdf',
                                '',
                              )}
                            </Typography>
                          </div>
                          <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            startIcon={<GetAppIcon />}
                            href={
                              protocolMap[
                                `${family.family}_HBP`
                              ].url
                            }
                            target="_blank"
                          >
                            Download Protocol
                          </Button>
                        </div>
                      )}
                      {protocolMap[
                        `${family.family}_FSS`
                      ] && (
                        <div className={classes.protocolRow}>
                          <div className={classes.protocolMeta}>
                            <DescriptionOutlinedIcon
                              className={classes.protocolIcon}
                            />
                            <div className={classes.protocolDivider} />
                            <Typography
                              variant="body2"
                              className={classes.protocolText}
                            >
                              {protocolMap[
                                `${family.family}_FSS`
                              ].name.replace(
                                '.pdf',
                                '',
                              )}
                            </Typography>
                          </div>
                          <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            startIcon={<GetAppIcon />}
                            href={
                              protocolMap[
                                `${family.family}_FSS`
                              ].url
                            }
                            target="_blank"
                          >
                            Download Protocol
                          </Button>
                        </div>
                      )}
                    </>
                  )}

                  {protocolMap[
                    `${family.family}_WETDEP`
                  ] && (
                    <div className={classes.protocolRow}>
                      <div className={classes.protocolMeta}>
                        <DescriptionOutlinedIcon
                          className={classes.protocolIcon}
                        />

                        <div className={classes.protocolDivider} />

                        <Typography
                          variant="body2"
                          className={classes.protocolText}
                        >
                          {protocolMap[
                            `${family.family}_WETDEP`
                          ].name.replace(
                            '.pdf',
                            '',
                          )}
                        </Typography>
                      </div>

                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        startIcon={<GetAppIcon />}
                        href={
                          protocolMap[
                            `${family.family}_WETDEP`
                          ].url
                        }
                        target="_blank"
                      >
                        Download Protocol
                      </Button>
                    </div>
                  )}

                  {protocolMap[
                    `${family.family}_PARTICULATE`
                  ] && (
                    <div className={classes.protocolRow}>
                      <div className={classes.protocolMeta}>
                        <DescriptionOutlinedIcon
                          className={classes.protocolIcon}
                        />

                        <div className={classes.protocolDivider} />

                        <Typography
                          variant="body2"
                          className={classes.protocolText}
                        >
                          {protocolMap[
                            `${family.family}_PARTICULATE`
                          ].name.replace(
                            '.pdf',
                            '',
                          )}
                        </Typography>
                      </div>

                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        startIcon={<GetAppIcon />}
                        href={
                          protocolMap[
                            `${family.family}_PARTICULATE`
                          ].url
                        }
                        target="_blank"
                      >
                        Download Protocol
                      </Button>
                    </div>
                  )}

                  <LinearProgress
                    variant="determinate"
                    value={family.percent}
                    classes={{
                      root: classes.progressRoot,
                    }}
                  />
                </div>
              </AccordionSummary>

              <AccordionDetails className={classes.accordionDetails}>
                {family.subtypes?.map((subtype) => {
                  const isIdentification = subtype.name.includes('Identifications');
                  const currentUrl = new URL(window.location.href);

                  currentUrl.searchParams.set('db', subtype.collid);
                  currentUrl.searchParams.set('page', '1');
                  currentUrl.searchParams.set('tabindex', '1');
                  currentUrl.searchParams.delete('imagepage');

                  return (
                    <div
                      key={subtype.name}
                      className={classes.subtypeRow}
                      style={{
                        paddingLeft: isIdentification ? 24 : 0,
                      }}
                    >
                      <div className={classes.subtypeLabel}>
                        {isIdentification ? (
                          <SubdirectoryArrowRightIcon
                            style={{
                              fontSize: 18,
                              opacity: 0.5,
                              marginRight: 2,
                            }}
                          />
                        ) : null}

                        <Link
                          href={`https://biorepo.neonscience.org/portal/collections/misc/neoncollprofiles.php?collid=${subtype.collid}`}
                          target="_blank"
                        >
                          <LinkIcon
                            className={classes.subtypeLinkIcon}
                          />
                        </Link>

                        <Typography
                          variant="body2"
                        >
                          <Link
                            className={classes.subtypeNameLink}
                            href={currentUrl.toString()}
                          >
                            {subtype.name}
                          </Link>
                        </Typography>
                      </div>

                      <Typography
                        variant="body2"
                        className={classes.subtypeCount}
                      >
                        {isIdentification
                          ? `${formatNumber(subtype.total)} Identifications`
                          : `${formatNumber(
                            subtype.total,
                          )} Samples (${subtype.percent}%)`}
                      </Typography>
                    </div>
                  );
                })}
              </AccordionDetails>

            </Accordion>
          );
        })}
        <Typography
          variant="body2"
          className={classes.footer}
        >
          {sampleTypes.length > 3 && (
            <div className={classes.footerButton}>
              <button
                type="button"
                className={`${classes.showAllButton} Mui`}
                onClick={() => setShowAll(!showAll)}
              >
                {showAll
                  ? 'Show fewer protocols'
                  : `Show all ${sampleTypes.length} protocols`}
              </button>
            </div>
          )}
          <div className={classes.footerTotal}>
            {`${formatNumber(totalRecords)} total samples`}
          </div>
        </Typography>
      </Card>
    </ThemeProvider>
  );
}
