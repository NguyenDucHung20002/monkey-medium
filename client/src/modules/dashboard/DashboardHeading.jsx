/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React from "react";

const DashboardHeading = ({ title = "", desc = "", children }) => {
  return (
    <div className="flex items-start justify-between mb-3">
      <div>
        <h1 className="dashboard-heading">{title}</h1>
        <p className="dashboard-short-desc">{desc}</p>
      </div>
      {children}
    </div>
  );
};

export default DashboardHeading;
