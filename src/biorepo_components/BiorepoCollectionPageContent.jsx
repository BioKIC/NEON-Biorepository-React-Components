import React, { useEffect, useState } from 'react';
import DocumentListItem from '../lib_components/components/Documents/DocumentListItem';

export default function BiorepoCollectionPageContent() {
  const [filteredSpecs, setFilteredSpecs] = useState([]);

  useEffect(() => {
    // Get the list of product IDs from the global JavaScript variable
    const productIds = window.BiorepoCollectionData ? JSON.parse(window.BiorepoCollectionData) : [];

    if (productIds.length === 0) return;

    // Fetch specs for each product ID
    const fetchSpecs = async () => {
      try {
        const responses = await Promise.all(
          productIds.map((productId) => fetch(`https://data.neonscience.org/api/v0/products/${productId}`).then((res) => res.json())),
        );

        // Extract and filter specs based on "Protocol" in specDescription
        const allFilteredSpecs = responses.flatMap((response) => response.data?.specs?.filter((spec) => spec.specDescription.includes('Protocol and Procedure')) || []);

        const uniqueSpecsMap = new Map();
        allFilteredSpecs.forEach((spec) => {
          if (!uniqueSpecsMap.has(spec.specNumber)) {
            uniqueSpecsMap.set(spec.specNumber, spec);
          }
        });

        setFilteredSpecs(Array.from(uniqueSpecsMap.values()));
      } catch (error) {
        console.error('Error fetching product specs:', error);
      }
    };

    fetchSpecs();
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
        {filteredSpecs.length > 0 ? (
          filteredSpecs.map((spec, index) => (
            <DocumentListItem
              key={spec.specId || index}
              document={{
                name: spec.specNumber, // Document name
                type: spec.specType || 'application/pdf', // Default to PDF
                size: spec.specSize || 0, // Default size
                description: spec.specDescription, // Description
              }}
              containerComponent="div"
              enableDownloadButton
            />
          ))
        ) : (
          <p></p>
        )}
      </div>
    </>
  );
}
