import React from 'react';
import PropTypes from 'prop-types';
import styles from './collectionProfile/Profile.module.css';

export default function BiorepoSidebarContact({ divider = false }) {
  return (
    <div
      className={`${styles.sidebar} biorepo-sidebar-contact`}
      style={divider ? { borderTop: '1px solid #d5d7d8', marginTop: '24px' } : undefined}
    >
      <div className={styles.sidebarContact}>
        <p className={styles.sidebarContactText}>Have questions about samples?</p>
        <a href="https://www.neonscience.org/about/contact-neon-biorepository" target="_blank" rel="noopener noreferrer">
          Contact the Biorepository
        </a>
      </div>
    </div>
  );
}

BiorepoSidebarContact.propTypes = { divider: PropTypes.bool };
