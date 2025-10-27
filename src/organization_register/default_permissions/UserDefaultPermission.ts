export const  userDefaultPermission = [
  {
    "moduleName": "Settings",
    "expanded": false,
    "children": [
      {
        "moduleName": "Roles & Permissions",
        "fullaccess": false,
        "create": false,
        "view": false,
        "edit": false,
        "delete": false,
        "export": false
      },
      {
        "moduleName": "Users",
        "fullaccess": false,
        "create": false,
        "view": false,
        "edit": false,
        "delete": false,
        "export": false
      },
      {
        "moduleName": "Vendors",
        "fullaccess": false,
        "create": false,
        "view": false,
        "edit": false,
        "delete": false,
        "export": false
      },
      {
        "moduleName": "Dashboard",
        "view": true
      }
    ]
  },
  {
    "moduleName": "Organisation Profile",
    "expanded": false,
    "children": [
      {
        "moduleName": "Organization Profile",
        "fullaccess": false,
        "view": false,
        "edit": false,
        "angularPermissions": {
          "canUserViewSubscriptionDetails": false
        }
      },
      {
        "moduleName": "Branch & Locations",
        "fullaccess": false,
        "create": false,
        "view": false,
        "edit": false,
        "delete": false
      },
      {
        "moduleName": "Department",
        "fullaccess": false,
        "create": false,
        "view": false,
        "edit": false,
        "delete": false,
        "export": false
      },
      {
        "moduleName": "Designation",
        "fullaccess": false,
        "create": false,
        "view": false,
        "edit": false,
        "delete": false,
        "export": false
      },
      {
        "moduleName": "Subscriptions",
        "fullaccess": false,
        "create": false,
        "view": false,
        "edit": false,
        "delete": false
      }
    ]
  },
  {
    "moduleName": "Asset",
    "expanded": true,
    "children": [
      {
        "moduleName": "Asset",
        "fullaccess": true,
        "create": true,
        "view": true,
        "edit": true,
        "delete": true,
        "import": true
      },
      {
        "moduleName": "Stock",
        "fullaccess": true,
        "create": true,
        "view": true,
        "edit": true,
        "delete": true,
        "import": true
      },
      {
        "moduleName": "Asset Allocation",
        "fullaccess": true,
        "create": true,
        "view": true,
        "edit": true,
        "delete": true,
        "import": true,
        "angularPermissions": {
          "canUserReturnAsset": true
        }
      },
      {
        "moduleName": "Asset Transfer",
        "fullaccess": true,
        "create": true,
        "view": true,
        "edit": true,
        "delete": true,
        "import": true
      },
      {
        "moduleName": "Detail View",
        "fullaccess": true,
        "create": true,
        "view": true,
        "edit": true,
        "delete": true,
        "import": true,
        "angularPermissions": {
          "canUserViewOtherStaffProfile": true
        }
      },
      {
        "moduleName": "Category, Sub-Category & Items",
        "fullaccess": false,
        "create": false,
        "view": true,
        "edit": false,
        "delete": false,
        "export": false,
        "angularPermissions": {
          "canUserMapAssetToAsset": false
        }
      },
      {
        "moduleName": "Fields",
        "fullaccess": false,
        "create": false,
        "view": true,
        "edit": false,
        "delete": false,
        "angularPermissions": {
          "canUserMapFieldsToItems": false
        }
      },
      {
        "moduleName": "Status",
        "fullaccess": false,
        "create": false,
        "view": true,
        "edit": false,
        "delete": false,
        "export": false
      },
      {
        "moduleName": "Ownership Mode",
        "fullaccess": false,
        "create": false,
        "view": true,
        "edit": false,
        "delete": false,
        "export": false
      },
      {
        "moduleName": "Working Status",
        "fullaccess": false,
        "create": false,
        "view": true,
        "edit": false,
        "delete": false
      }
    ]
  },
  {
    "moduleName": "Report & Auditing",
    "expanded": false,
    "children": [
      {
        "moduleName": "Audit Reconcile",
        "fullaccess": false,
        "create": false,
        "view": false,
        "edit": false,
        "delete": false
      },
      {
        "moduleName": "Audit Reconcile Confirm",
        "fullaccess": false,
        "create": false,
        "view": false,
        "edit": false,
        "delete": false
      },
      {
        "moduleName": "Audit Window",
        "fullaccess": false,
        "create": false,
        "view": false,
        "edit": false,
        "delete": false
      }
    ]
  },
  {
    "moduleName": "Depreciation",
    "expanded": false,
    "children": [
      {
        "moduleName": "Calculate",
        "fullaccess": false,
        "create": false,
        "view": false,
        "edit": false,
        "delete": false,
        "export": false
      },
      {
        "moduleName": "Class Selection",
        "fullaccess": false,
        "create": false,
        "view": false,
        "edit": false,
        "delete": false
      },
      {
        "moduleName": "Dispose",
        "fullaccess": false,
        "create": false,
        "view": false,
        "edit": false,
        "delete": false,
        "export": false
      },
      {
        "moduleName": "Dispose Reason",
        "fullaccess": false,
        "create": false,
        "view": false,
        "edit": false,
        "delete": false,
        "export": false
      }
    ]
  }
];