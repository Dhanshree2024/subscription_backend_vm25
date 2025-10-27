export const  adminDefaultPermission = [
  {
    "moduleName": "Settings",
    "expanded": true,
    "children": [
      {
        "moduleName": "Roles & Permissions",
        "fullaccess": true,
        "create": true,
        "view": true,
        "edit": true,
        "delete": true,
        "export": true,
        "import":true,
         "angularPermissions": {
            "CanUserEditPermissionsOfSameRole": true,
            "canUserViewSubscriptionDetails": true,
          },  
      },
      {
        "moduleName": "Users",
        "fullaccess": true,
        "create": true,
        "view": true,
        "edit": true,
        "delete": true,
        "export": true,
        "import":true
      },
      {
        "moduleName": "Vendors",
        "fullaccess": true,
        "create": true,
        "view": true,
        "edit": true,
        "delete": true,
        "export": true,
        "import":true
      },
      {
        "moduleName": "Dashboard",
        "view": true
      }
    ]
  },
  {
    "moduleName": "Organisation Profile",
    "expanded": true,
    "children": [
      {
        "moduleName": "Organization Profile",
        "fullaccess": true,
        "view": true,
        "edit": true,
        "angularPermissions": {
          "canUserViewSubscriptionDetails": true
        }
      },
      {
        "moduleName": "Branch & Locations",
        "fullaccess": true,
        "create": true,
        "view": true,
        "edit": true,
        "delete": true,
        "export": true,
        "import":true
      },
      {
        "moduleName": "Department",
        "fullaccess": true,
        "create": true,
        "view": true,
        "edit": true,
        "delete": true,
        "export": true,
        "import":true
      },
      {
        "moduleName": "Designation",
        "fullaccess": true,
        "create": true,
        "view": true,
        "edit": true,
        "delete": true,
        "export": true,
        "import":true
      },
      {
        "moduleName": "Subscriptions",
        "fullaccess": true,
        "create": true,
        "view": true,
        "edit": true,
        "delete": true,
        "export": true,
        "import":true
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
       "export": true,
        "import":true,
      },
      {
        "moduleName": "Stock",
        "fullaccess": true,
        "create": true,
        "view": true,
        "edit": true,
        "delete": true,
        "import": true,
        "export": true,
       
      },
      {
        "moduleName": "Asset Allocation",
        "fullaccess": true,
        "create": true,
        "view": true,
        "edit": true,
        "delete": true,
        "export": true,
        "import":true,
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
        "export": true,
        "import":true,
      },
      {
        "moduleName": "Detail View",
        "fullaccess": true,
        "create": true,
        "view": true,
        "edit": true,
        "delete": true,
        "export": true,
        "import":true,
        "angularPermissions": {
          "canUserViewOtherStaffProfile": true
        }
      },
      {
        "moduleName": "Category, Sub-Category & Items",
        "fullaccess": true,
        "create": true,
        "view": true,
        "edit": true,
        "delete": true,
        "export": true,
        "import":true,
        "angularPermissions": {
          "canUserMapAssetToAsset": true
        }
      },
      {
        "moduleName": "Fields",
        "fullaccess": true,
        "create": true,
        "view": true,
        "edit": true,
        "delete": true,
        "export": true,
        "import":true,
        "angularPermissions": {
          "canUserMapFieldsToItems": true
        }
      },
      {
        "moduleName": "Status",
        "fullaccess": true,
        "create": true,
        "view": true,
        "edit": true,
        "delete": true,
        "export": true,
        "import":true
      },
      {
        "moduleName": "Ownership Mode",
        "fullaccess": true,
        "create": true,
        "view": true,
        "edit": true,
        "delete": true,
        "export": true,
        "import":true
      },
      {
        "moduleName": "Working Status",
        "fullaccess": true,
        "create": true,
        "view": true,
        "edit": true,
        "delete": true,
        "export": true,
        "import":true
      }
    ]
  },
  {
    "moduleName": "Report & Auditing",
    "expanded": true,
    "children": [
      {
        "moduleName": "Audit Reconcile",
        "fullaccess": true,
        "create": true,
        "view": true,
        "edit": true,
        "delete": true,
        "export": true,
        "import":true
      },
      {
        "moduleName": "Audit Reconcile Confirm",
        "fullaccess": true,
        "create": true,
        "view": true,
        "edit": true,
        "delete": true,
        "export": true,
        "import":true
      },
      {
        "moduleName": "Audit Window",
        "fullaccess": true,
        "create": true,
        "view": true,
        "edit": true,
        "delete": true,
        "export": true,
        "import":true
      }
    ]
  },
  {
    "moduleName": "Depreciation",
    "expanded": true,
    "children": [
      {
        "moduleName": "Calculate",
        "fullaccess": true,
        "create": true,
        "view": true,
        "edit": true,
        "delete": true,
        "export": true,
        "import":true

      },
      {
        "moduleName": "Class Selection",
        "fullaccess": true,
        "create": true,
        "view": true,
        "edit": true,
        "delete": true,
        "export": true,
        "import":true
      },
      {
        "moduleName": "Dispose",
        "fullaccess": true,
        "create": true,
        "view": true,
        "edit": true,
        "delete": true,
        "export": true,
        "import":true
      },
      {
        "moduleName": "Dispose Reason",
        "fullaccess": true,
        "create": true,
        "view": true,
        "edit": true,
        "delete": true,
        "export": true,
        "import":true
      }
    ]
  }
];