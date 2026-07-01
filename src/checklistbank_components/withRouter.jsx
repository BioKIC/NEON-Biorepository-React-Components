import React from "react";

const makeHistory = () => ({
  push: (to) => {
    const url =
      typeof to === "object"
        ? `${to.pathname || window.location.pathname}${to.search || ""}`
        : to;

    window.history.pushState({}, "", url);
  },

  replace: (to) => {
    const url =
      typeof to === "object"
        ? `${to.pathname || window.location.pathname}${to.search || ""}`
        : to;

    window.history.replaceState({}, "", url);
  },

  go: (n) => window.history.go(n),
  goBack: () => window.history.back(),
  goForward: () => window.history.forward(),
  location: window.location,
});

const withRouter = (Component) => {
  const Wrapped = (props) => {
    return (
      <Component
        {...props}
        history={makeHistory()}
        location={window.location}
        match={{ params: {} }}
        navigate={() => {}}
      />
    );
  };

  Wrapped.displayName = `withRouter(${Component.displayName || Component.name || "Component"})`;
  return Wrapped;
};

export default withRouter;