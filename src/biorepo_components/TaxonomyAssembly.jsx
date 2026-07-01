/* eslint-disable */
import { useEffect, useState, useRef } from "react";
import {
  EyeOutlined,
  PlusOutlined,
  SyncOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import {
  Row,
  Col,
  App,
  Button,
  Alert,
  Radio,
  Slider,
  Switch,
  Popover,
} from "antd";
import _ from "lodash";
import axios from "axios";
import config from "../checklistbank_components/config";
import { ColTreeContext, applyDecision } from "../checklistbank_components/pages/project/Assembly/ColTreeContext";
import ColTree from "../checklistbank_components/pages/project/Assembly/ColTree";
import DatasetAutocomplete from "../checklistbank_components/pages/project/Assembly/DatasetAutocomplete";
import NameAutocomplete from "../checklistbank_components/pages/project/Assembly/NameAutocomplete";
import AddChildModal from "../checklistbank_components/pages/project/Assembly/AddChildModal";
import qs from "query-string";

axios.defaults.headers.common.Authorization =
  "Basic " + btoa("sunray1:Sunnray11");

const TaxonomyAssembly = () => {
  const location = window.location;
  const { notification } = App.useApp();
  const params = Object.fromEntries(
    new URLSearchParams(window.location.search)
  );
  const projectKey = 314762;
  const project = {
    key: projectKey,
    title: "Assembly"
  };

  const [mode, setMode] = useState("attach");
  const [assemblyColSpan, setAssemblyColSpan] = useState(12);
  const [sourceColSpan, setSourceColSpan] = useState(12);
  const [assemblyTaxonKey, setAssemblyTaxonKey] = useState(
    params.assemblyTaxonKey || null
  );
  const [sourceTaxonKey, setSourceTaxonKey] = useState(
    params.sourceTaxonKey || null
  );
  const [datasetKey, setDatasetKey] = useState(params.datasetKey || null);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [childModalVisible, setChildModalVisible] = useState(false);
  const [insertPlaceholder, setInsertPlaceholder] = useState(false);
  const [missingTargetKeys, setMissingTargetKeys] = useState({});
  const [height, setHeight] = useState(600);
  const [decisionFormVisible, setDecisionFormVisible] = useState(false);
  const [error, setError] = useState(null);
  const [dragNode, setDragNode] = useState(null);

  const wrapperRef = useRef(null);
  const assemblyRef = useRef(null);
  const sourceRef = useRef(null);

  const resizeHandler = () => {
    const h = _.get(wrapperRef, "current.clientHeight");
    if (h) {
      setHeight(h);
    }
  };
  
  const history = {
    push: ({ pathname, search }) => {
      window.history.pushState(
        {},
        "",
        `${pathname || window.location.pathname}${search || ""}`
      );
    },
  };

  useEffect(() => {
    resizeHandler();
    window.addEventListener("resize", resizeHandler);
    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync assemblyTaxonKey and sourceTaxonKey from URL search params
  useEffect(() => {
    const p = qs.parse(_.get(location, "search"));
    setAssemblyTaxonKey(_.get(p, "assemblyTaxonKey") || null);
    setSourceTaxonKey(_.get(p, "sourceTaxonKey") || null);
  }, [location.search]);

  const getSectorInfo = (attachment, root, mode) => {
    const rootData = _.get(root, "taxon");
    const attachmentData = _.get(attachment, "taxon");
    return mode === "REPLACE"
      ? replace(rootData, attachmentData, mode)
      : saveSector(rootData, attachmentData, mode);
  };

  const saveChild = (subject, target) => {
    return axios
      .post(
        `${config.dataApi}dataset/${projectKey}/tree/${encodeURIComponent(
          target.id
        )}/copy`,
        {
          datasetKey: subject.datasetKey,
          id: subject.id,
        }
      )
      .then((res) => {
        return axios(
          `${config.dataApi}dataset/${projectKey}/taxon/${encodeURIComponent(
            res.data
          )}`
        );
      });
  };

  const replace = (subject, target) => {
    const { parentId } = target;
    const currentParams = qs.parse(_.get(location, "search"));
    return axios(
      `${config.dataApi}dataset/${projectKey}/taxon/${encodeURIComponent(
        parentId
      )}`
    )
      .then((res) => {
        const parent = res.data;
        // delete recursive
        return axios
          .delete(
            `${config.dataApi}dataset/${projectKey}/tree/${encodeURIComponent(
              target.id
            )}`
          )
          .then(() => parent);
      })
      .then((parent) => {
        if (assemblyTaxonKey === target.id) {
          history.push({
            pathname: `/project/${projectKey}/assembly`,
            search: `?${qs.stringify(_.omit(currentParams, ["assemblyTaxonKey"]))}`,
          });
          setAssemblyTaxonKey(null);
        }
        notification.open({
          message: "Removed existing taxon",
          description: `Old ${target.name} was removed from the assembly, removing children.`,
        });
        return saveSector(subject, parent, "ATTACH");
      });
  };

  const onDeleteSector = () => {
    assemblyRef.current.reloadRoot();
    if (sourceRef.current && typeof sourceRef.current.reloadRoot === "function") {
      sourceRef.current.reloadRoot();
    }
  };

  const saveSector = (subject, target, mode) => {
    const sector = {
      subjectDatasetKey: subject.datasetKey,
      datasetKey: projectKey,
      mode: mode,
      subject: { id: subject.id, status: subject.status, rank: subject.rank },
      target: { id: target.id, status: target.status, rank: target.rank },
    };

    return axios
      .post(`${config.dataApi}dataset/${projectKey}/sector`, sector)
      .then((res) => {
        const msg = `${
          _.get(target, "name.scientificName") || target.id
        } attached to ${subject.name || subject.id} `;
        notification.open({
          message: "Sector created",
          description: msg,
        });
      })
      .catch((err) => {
        setError(err);
        console.log(err);
      });
  };

  const showSourceTaxon = async (taxon) => {
    const taxonId = taxon?.id;
    try {
      const res = await axios(
        `${config.dataApi}dataset/${projectKey}/taxon/${taxonId}/source`
      );
      const datasetRes = await axios(
        `${config.dataApi}dataset/${res.data.sourceDatasetKey}`
      );
      const currentParams = qs.parse(_.get(location, "search"));
      const newParams = {
        ...currentParams,
        sourceTaxonKey: res.data.sourceId,
        datasetKey: res.data.sourceDatasetKey,
      };
      history.push({
        pathname: `/project/${projectKey}/assembly`,
        search: `?${qs.stringify(newParams)}`,
      });
      setSourceTaxonKey(res.data.sourceId);
      setDatasetKey(res.data.sourceDatasetKey);
      setSelectedDataset({
        key: datasetRes.data.key,
        title: datasetRes.data.alias || datasetRes.data.title,
      });
    } catch (err) {
      console.log(err);
    }
  };

  const addMissingTargetKey = (key) => {
    setMissingTargetKeys((prev) => ({ ...prev, [key]: true }));
  };

  const onSelectDataset = (dataset) => {
    const shouldUpdate = Number(datasetKey) !== Number(dataset.key);
    if (shouldUpdate) {
      setDatasetKey(Number(dataset.key));
      setSelectedDataset(dataset);
      setSourceTaxonKey(null);
      const currentParams = qs.parse(_.get(location, "search"));
      const newParams = {
        ...currentParams,
        datasetKey: _.get(dataset, "key"),
      };
      history.push({
        pathname: `/project/${projectKey}/assembly`,
        search: `?${qs.stringify(_.omit(newParams, ["sourceTaxonKey"]))}`,
      });
    } else {
      // If it is the initial load, the title of the dataset comes from the dataset select component
      setSelectedDataset(dataset);
    }
  };

  const onDragStart = (e, dataset) => {
    e.node.ref.dataset = dataset;
    setDragNode(e.node);
  };

  const toggleMode = (newMode) => {
    setMode(newMode);
  };

  return (
    <div className="assembly-workspace">
      <ColTreeContext.Provider
        value={{
          mode: mode,
          toggleMode: toggleMode,
          missingTargetKeys: missingTargetKeys,
          selectedSourceDatasetKey: _.get(selectedDataset, "key"),
          selectedSourceTreeNodes:
            _.get(sourceRef.current, "state.selectedNodes") || [],
          selectedAssemblyTreeNodes:
            _.get(assemblyRef.current, "state.selectedNodes") || [],
          applyDecision: (taxon, projectKey, cb) => applyDecision(taxon, projectKey, cb, notification),
        }}
      >
        {decisionFormVisible && (
          <ColTreeContext.Consumer>
            {({ selectedSourceTreeNodes }) => (
              <DecisionForm
                destroyOnHidden={true}
                rowsForEdit={selectedSourceTreeNodes.map((n) => ({
                  usage: {
                    name: {
                      scientificName: n?.ref?.taxon?.name,
                      authorship: n?.ref?.taxon?.authorship,
                      rank: n?.ref?.taxon?.rank,
                    },
                    id: n?.ref?.taxon?.id,
                    status: n?.ref?.taxon?.status,
                  },
                  parent: n?.parent?.name,
                  decisions: n?.ref?.taxon?.decision
                    ? [n?.ref?.taxon?.decision]
                    : null,
                }))}
                onCancel={() => {
                  setDecisionFormVisible(false);
                  sourceRef.current.reloadRoot();
                }}
                onOk={() => {
                  setDecisionFormVisible(false);
                  sourceRef.current.reloadRoot();
                }}
                onSaveDecision={(name) => {
                  console.log(name);
                }}
                datasetKey={projectKey}
                subjectDatasetKey={datasetKey}
              />
            )}
          </ColTreeContext.Consumer>
        )}
        <Row>
          <Col>
            <ColTreeContext.Consumer>
              {({ mode, toggleMode }) => (
                <Radio.Group
                  value={mode}
                  onChange={(e) => toggleMode(e.target.value)}
                >
                  <Radio.Button value="modify">Modify Tree</Radio.Button>
                  <Radio.Button value="attach">Add sectors</Radio.Button>
                </Radio.Group>
              )}
            </ColTreeContext.Consumer>
          </Col>
          <Col flex="auto"></Col>
          <Col>
            <Switch
              onChange={(checked) => setInsertPlaceholder(checked)}
              checkedChildren={"Show placeholder ranks"}
              unCheckedChildren={"Show placeholder ranks"}
            />
          </Col>
        </Row>
        <Row>
          <div style={{ width: "100%" }}>
            <Slider
              min={0}
              max={24}
              value={assemblyColSpan}
              onChange={(value) => {
                setAssemblyColSpan(value);
                setSourceColSpan(24 - value);
              }}
              step={1}
            />
          </div>
        </Row>

        <Row>
          <Col span={assemblyColSpan} className="assembly-tree-box">
            <Row>
              <Col span={12}>
                <h4>{project.title}</h4>{" "}
              </Col>
              <Col span={12} style={{ textAlign: "right" }}>
                {childModalVisible && (
                  <AddChildModal
                    onCancel={() => setChildModalVisible(false)}
                    onSuccess={() => {
                      setChildModalVisible(false);
                      assemblyRef.current.reloadRoot();
                    }}
                    parent={null}
                    projectKey={projectKey}
                  />
                )}
                <Button
                  icon={<PlusOutlined />}
                  size="small"
                  style={{ marginRight: "6px" }}
                  onClick={(e) => {
                    setChildModalVisible(true);
                  }}
                >
                  Add root
                </Button>
                <Button
                  icon={<SyncOutlined />}
                  size="small"
                  onClick={(e) => {
                    const currentParams = qs.parse(_.get(location, "search"));
                    const newParams = {
                      ...currentParams,
                      assemblyTaxonKey: null,
                    };
                    history.push({
                      pathname: `/project/${projectKey}/assembly`,
                      search: `?${qs.stringify(
                        _.omit(newParams, ["assemblyTaxonKey"])
                      )}`,
                    });
                    setAssemblyTaxonKey(null);
                    assemblyRef.current.reloadLoadedKeys();
                  }}
                >
                  Refresh
                </Button>
              </Col>
            </Row>

            <NameAutocomplete
              datasetKey={projectKey}
              defaultTaxonKey={
                _.get(
                  qs.parse(_.get(location, "search")),
                  "assemblyTaxonKey"
                ) || null
              }
              onError={(err) => setError(err)}
              onSelectName={(name) => {
                const currentParams = qs.parse(_.get(location, "search"));
                const newParams = {
                  ...currentParams,
                  assemblyTaxonKey: _.get(name, "key"),
                };
                history.push({
                  pathname: `/project/${projectKey}/assembly`,
                  search: `?${qs.stringify(newParams)}`,
                });
                setAssemblyTaxonKey(name.key);
                // Pass the key explicitly: RR6 navigation is async so the new
                // defaultExpandKey prop has not propagated yet (issue #1671).
                assemblyRef.current.reloadRoot(name.key);
              }}
              onResetSearch={() => {
                const currentParams = qs.parse(_.get(location, "search"));
                const newParams = { ...currentParams, assemblyTaxonKey: null };
                history.push({
                  pathname: `/project/${projectKey}/assembly`,
                  search: `?${qs.stringify(
                    _.omit(newParams, ["assemblyTaxonKey"])
                  )}`,
                });
                setAssemblyTaxonKey(null);
              }}
            />
            {error && (
              <Alert
                closable={{ onClose: () => setError(null) }}
                description={<ErrorMsg error={error} />}
                type="error"
              />
            )}
            {project && (
              <div ref={wrapperRef} style={{ height: "100%" }}>
                {" "}
                <ColTree
                  insertPlaceholder={insertPlaceholder}
                  height={height}
                  treeRef={(ref) => (assemblyRef.current = ref)}
                  location={location}
                  dataset={{ key: projectKey }}
                  treeType="CATALOGUE"
                  projectKey={projectKey}
                  onDeleteSector={onDeleteSector}
                  attachFn={getSectorInfo}
                  onDragStart={(e) => onDragStart(e, project)}
                  dragNode={dragNode}
                  selectedSourceTreeNodes={
                    _.get(sourceRef.current, "state.selectedNodes") || []
                  }
                  draggable={true}
                  showSourceTaxon={showSourceTaxon}
                  defaultExpandKey={assemblyTaxonKey}
                  addMissingTargetKey={addMissingTargetKey}
                />
              </div>
            )}
          </Col>

          <Col span={sourceColSpan} style={{ paddingLeft: "8px" }}>
            <Row>
              <Col>
                <h4>
                  {selectedDataset ? (
                    <>
                      {" "}
                      {selectedDataset.alias || selectedDataset.title}
                      <a href={`/dataset/${selectedDataset.key}/metadata`}>
                        <EyeOutlined /> source
                      </a>
                    </>
                  ) : (
                    "No dataset selected"
                  )}
                </h4>
              </Col>
              <Col flex="auto"></Col>
              <Col>
                <ColTreeContext.Consumer>
                  {({ selectedSourceTreeNodes }) =>
                    selectedSourceTreeNodes.length > 0 && (
                      <>
                        <span>
                          {selectedSourceTreeNodes.length} selected
                        </span>
                        <Popover
                          trigger="click"
                          placement="bottomRight"
                          content={
                            <>
                              <Button
                                style={{
                                  marginTop: "8px",
                                  width: "100%",
                                }}
                                type="primary"
                                danger
                                onClick={() => {
                                  Promise.allSettled(
                                    selectedSourceTreeNodes.map((n) =>
                                      applyDecision(n.taxon, projectKey, undefined, notification)
                                    )
                                  ).then(() => {
                                    sourceRef.current.reloadRoot();
                                  });
                                }}
                              >
                                {`Block ${selectedSourceTreeNodes.length} taxa`}
                              </Button>
                              <Button
                                style={{
                                  marginTop: "8px",
                                  width: "100%",
                                }}
                                type="primary"
                                onClick={() =>
                                  setDecisionFormVisible(true)
                                }
                              >
                                {`Apply decisions`}
                              </Button>
                              <Button
                                style={{
                                  marginTop: "8px",
                                  width: "100%",
                                }}
                                type="primary"
                                danger
                                onClick={() => {
                                  const taxaWithdecisions =
                                    selectedSourceTreeNodes.filter(
                                      (n) => !!n?.taxon?.decision
                                    );
                                  Promise.allSettled(
                                    taxaWithdecisions.map((n) => {
                                      return axios.delete(
                                        `${config.dataApi}dataset/${projectKey}/decision/${n.taxon.decision.id}`
                                      );
                                    })
                                  ).then(() => {
                                    sourceRef.current.reloadRoot();
                                    notification.open({
                                      message: "Decisions deleted for:",
                                      description: (
                                        <ul>
                                          {taxaWithdecisions.map((n) => (
                                            <li>{n?.taxon?.name}</li>
                                          ))}
                                        </ul>
                                      ),
                                    });
                                  });
                                }}
                              >
                                {`Delete decisions`}
                              </Button>
                            </>
                          }
                        >
                          <Button
                            type="link"
                            style={{ padding: "0px 3px" }}
                          >
                            <SettingOutlined />
                          </Button>
                        </Popover>
                      </>
                    )
                  }
                </ColTreeContext.Consumer>
              </Col>
            </Row>

            <DatasetAutocomplete
              minSize={1}
              onSelectDataset={onSelectDataset}
              defaultDatasetKey={_.get(params, "datasetKey") || null}
              onResetSearch={() => {
                history.push({
                  pathname: `/project/${projectKey}/assembly`,
                  search: `?${qs.stringify(
                    _.omit(params, ["datasetKey"])
                  )}`,
                });
                setSelectedDataset(null);
              }}
            />

            <br />
            {selectedDataset && (
              <NameAutocomplete
                datasetKey={selectedDataset.key}
                defaultTaxonKey={
                  _.get(
                    qs.parse(_.get(location, "search")),
                    "sourceTaxonKey"
                  ) || null
                }
                onError={(err) => setError(err)}
                onSelectName={(name) => {
                  const currentParams = qs.parse(_.get(location, "search"));
                  const newParams = {
                    ...currentParams,
                    sourceTaxonKey: _.get(name, "key"),
                  };
                  history.push({
                    pathname: `/project/${projectKey}/assembly`,
                    search: `?${qs.stringify(newParams)}`,
                  });
                  setSourceTaxonKey(name.key);
                  // Pass the key explicitly: RR6 navigation is async so the
                  // new defaultExpandKey prop has not propagated yet (#1671).
                  sourceRef.current.reloadRoot(name.key);
                }}
                onResetSearch={() => {
                  const currentParams = qs.parse(_.get(location, "search"));
                  const newParams = { ...currentParams, sourceTaxonKey: null };
                  history.push({
                    pathname: `/project/${projectKey}/assembly`,
                    search: `?${qs.stringify(
                      _.omit(newParams, ["sourceTaxonKey"])
                    )}`,
                  });
                  setSourceTaxonKey(null);
                }}
              />
            )}
            {selectedDataset && (
              <ColTree
                insertPlaceholder={insertPlaceholder}
                height={height}
                treeRef={(ref) => (sourceRef.current = ref)}
                location={location}
                dataset={selectedDataset}
                treeType="SOURCE"
                projectKey={projectKey}
                onDeleteSector={onDeleteSector}
                onDragStart={(e) => onDragStart(e, selectedDataset)}
                draggable={
                  mode === "attach"
                }
                defaultExpandKey={sourceTaxonKey}
                showSourceTaxon={({ sector }) => {
                  const isPlaceholder = !_.isUndefined(
                    sector.placeholderRank
                  );
                  const targetID = isPlaceholder
                    ? `${
                        sector.target.id
                      }--incertae-sedis--${sector.placeholderRank.toUpperCase()}`
                    : sector.target.id;
                  const currentParams = qs.parse(_.get(location, "search"));
                  const newParams = {
                    ...currentParams,
                    assemblyTaxonKey: targetID,
                  };
                  history.push({
                    pathname: `/project/${projectKey}/assembly`,
                    search: `?${qs.stringify(newParams)}`,
                  });
                  setAssemblyTaxonKey(targetID);
                  // Pass the key explicitly: RR6 navigation is async so the
                  // new defaultExpandKey prop has not propagated yet (#1671).
                  assemblyRef.current.reloadRoot(targetID);
                }}
              />
            )}
          </Col>
        </Row>
      </ColTreeContext.Provider>
    </div>
  );
};

export default TaxonomyAssembly ;
