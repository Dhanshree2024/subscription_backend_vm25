import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';


@Injectable()
export class OrganizationPermissionScript {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) { }

  async createOrganizationPermissionTable(schemaName: string): Promise<void> {
    await this.dataSource.query(`
            
            CREATE TABLE IF NOT EXISTS ${schemaName}.organization_permissions (
                permission_id SERIAL PRIMARY KEY, -- Auto-incrementing primary key
                role_id INT NOT NULL, -- Foreign key referencing roles.role_id
                -- module_name VARCHAR(255) NOT NULL, -- Module name (HR, Payroll, Attendance, etc.)
                permissions JSONB NOT NULL, -- Action (View, Create, Edit, Delete, etc.)
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Record creation timestamp
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Last update timestamp
                is_active BOOLEAN DEFAULT TRUE, -- Indicates if the document type is active
                is_deleted BOOLEAN DEFAULT FALSE, -- Indicates if the document type is deleted
                CONSTRAINT fk_role FOREIGN KEY (role_id) REFERENCES ${schemaName}.organization_roles (role_id)-- Foreign key constraint to link with roles table
            );

        `);


    const permissionsJsonAdmin = [
      {
        "moduleName": "Organisation Profile",
        "children": [
          {
            "moduleName": "Organization Profile",
            "edit": true,
            "view": true,
            "fullaccess": true,
            "angularPermissions": {
              "canUserViewSubscriptionDetails": true
            }
          },
          {
            "moduleName": "Branch & Locations",
            "edit": true,
            "view": true,
            "create": true,
            "delete": true,
            "export": true,
            "fullaccess": true,
            "angularPermissions": {}
          },
          {
            "moduleName": "Department",
            "edit": true,
            "view": true,
            "create": true,
            "delete": true,
            "export": true,
            "fullaccess": true,
            "angularPermissions": {}
          },
          {
            "moduleName": "Designation",
            "edit": true,
            "view": true,
            "create": true,
            "delete": true,
            "export": true,
            "fullaccess": true,
            "angularPermissions": {}
          },
          {
            "moduleName": "Roles & Permissions",
            "edit": true,
            "view": true,
            "create": true,
            "delete": true,
            "export": true,
            "fullaccess": true,
            "angularPermissions": {}
          },
          {
            "moduleName": "Setting",
            // "edit": true,
            // "view": true,
            // "create": true,
            // "delete": true,
            // "fullaccess": true,
            // "angularPermissions": {}
            children: [
              {
                edit: true,
                view: true,
                scope: "",
                create: true,
                delete: true,
                export: true,
                import: true,
                fullaccess: true,
                moduleName: "Leave Settings",
                angularPermissions: {}
              },
              {
                edit: true,
                view: true,
                scope: "",
                create: true,
                delete: true,
                export: true,
                import: true,
                fullaccess: true,
                moduleName: "Shift Settings",
                angularPermissions: {}
              },
              {
                edit: true,
                view: true,
                scope: "",
                create: true,
                delete: true,
                export: true,
                import: true,
                fullaccess: true,
                moduleName: "Benefits Setup",
                angularPermissions: {}
              },
              {
                edit: true,
                view: true,
                scope: "",
                create: true,
                delete: true,
                export: true,
                import: true,
                fullaccess: true,
                moduleName: "Employee Id Setup",
                angularPermissions: {}
              },
              {
                edit: true,
                view: true,
                scope: "",
                create: true,
                delete: true,
                export: true,
                import: true,
                fullaccess: true,
                moduleName: "Attendance Stting",
                angularPermissions: {}
              }
            ]
          }
        ]
      },
      {
        "moduleName": "Attendance",
        "children": [
          {
            "moduleName": "Dashboard",
            "view": true,
            "export": true,
            "angularPermissions": {}
          },
          {
            "moduleName": "Attendance log",
            "edit": true,
            "view": true,
            "create": true,
            "delete": true,
            "export": true,
            "import": true,
            "fullaccess": true,
            "angularPermissions": {}
          },
          {
            "moduleName": "Leave",
            "edit": true,
            "view": true,
            "create": true,
            "delete": true,
            "export": true,
            "import": true,
            "fullaccess": true,
            "angularPermissions": {}
          },
          {
            "moduleName": "Shift Schedule",
            "edit": true,
            "view": true,
            "create": true,
            "delete": true,
            "export": true,
            "import": true,
            "fullaccess": true,
            "angularPermissions": {}
          },
          {
            "moduleName": "Request",
            // "edit": true,
            // "view": true,
            // "create": true,
            // "delete": true,
            // "export": true,
            // "import": true,
            // "fullaccess": true,
            // "angularPermissions": {}
            children: [
              {
                edit: true,
                view: true,
                scope: "",
                create: true,
                delete: true,
                export: true,
                import: true,
                fullaccess: true,
                moduleName: "Attedance",
                angularPermissions: {}
              },
              {
                edit: true,
                view: true,
                scope: "",
                create: true,
                delete: true,
                export: true,
                import: true,
                fullaccess: true,
                moduleName: "Shift",
                angularPermissions: {}
              },
              {
                edit: true,
                view: true,
                scope: "",
                create: true,
                delete: true,
                export: true,
                import: true,
                fullaccess: true,
                moduleName: "Leave",
                angularPermissions: {}
              }
            ]
          },
          {
            "moduleName": "Attendance Records of Others",
            "edit": true,
            "view": true,
            "create": true,
            "delete": true,
            "export": true,
            "import": true,
            "fullaccess": true,
            "angularPermissions": {}
          }
        ]
      },
      {
        "moduleName": "Offboarding",
        "children": [
          {
            "moduleName": "Offboarding",
            "edit": true,
            "view": true,
            "create": true,
            "delete": true,
            "export": true,
            "fullaccess": true,
            "angularPermissions": {
              "enableToGiveRegination": true
            }
          }
        ]
      },
      {
        "moduleName": "Employee Management",
        "children": [
          {
            "moduleName": "All Employee",
            "edit": true,
            "view": true,
            "create": true,
            "delete": true,
            "export": true,
            "fullaccess": true,
            "angularPermissions": {
              "userPasswordReset": true
            }
          },
          {
            "moduleName": "Employee Profile",
            "edit": true,
            "view": true,
            "create": true,
            "delete": true,
            "export": true,
            "fullaccess": true,
            "angularPermissions": {
              "userPasswordReset": true
            }
          },
          {
            "moduleName": "Disciplinary Action",
            "edit": true,
            "view": true,
            "create": true,
            "delete": true,
            "export": true,
            "fullaccess": true,
            "angularPermissions": {
              "giveAccessForCreateActionStage": true
            }
          },
          {
            "moduleName": "Benefits",
            // "edit": true,
            // "view": true,
            // "create": true,
            // "delete": true,
            // "export": true,
            // "fullaccess": true,
            // "angularPermissions": {}
            children: [
              {
                edit: true,
                view: true,
                scope: "",
                create: true,
                delete: true,
                export: true,
                import: true,
                fullaccess: true,
                moduleName: "PF",
                angularPermissions: {}
              },
              {
                edit: true,
                view: true,
                scope: "",
                create: true,
                delete: true,
                export: true,
                import: true,
                fullaccess: true,
                moduleName: "ESIC",
                angularPermissions: {}
              },
              {
                edit: true,
                view: true,
                scope: "",
                create: true,
                delete: true,
                export: true,
                import: true,
                fullaccess: true,
                moduleName: "Health Insurance",
                angularPermissions: {}
              },
              {
                edit: true,
                view: true,
                scope: "",
                create: true,
                delete: true,
                export: true,
                import: true,
                fullaccess: true,
                moduleName: "LWF",
                angularPermissions: {}
              }
            ]
          },
          {
            "moduleName": "Assets",
            "edit": true,
            "view": true,
            "create": true,
            "delete": true,
            "export": true,
            "fullaccess": true,
            "angularPermissions": {}
          },
          {
            "moduleName": "External Users",
            "edit": true,
            "view": true,
            "create": true,
            "delete": true,
            "export": true,
            "fullaccess": true,
            "angularPermissions": {}
          },
          {
            "moduleName": "Teams",
            "edit": true,
            "view": true,
            "create": true,
            "delete": true,
            "export": true,
            "fullaccess": true,
            "angularPermissions": {}
          },
          {
            "moduleName": "Other View",
            "edit": true,
            "view": true,
            "create": true,
            "delete": true,
            "export": true,
            "fullaccess": true,
            "angularPermissions": {}
          }
        ]
      },
      {
        "moduleName": "Recruitment Management",
        "children": [
          {
            "moduleName": "Openings",
            // "edit": true,
            // "view": true,
            // "create": true,
            // "delete": true,
            // "export": true,
            // "fullaccess": true,
            // "angularPermissions": {}
            children: [
              {
                edit: true,
                view: true,
                scope: "",
                create: true,
                delete: true,
                export: true,
                import: true,
                fullaccess: true,
                moduleName: "Live",
                angularPermissions: {}
              },
              {
                edit: true,
                view: true,
                scope: "",
                create: true,
                delete: true,
                export: true,
                import: true,
                fullaccess: true,
                moduleName: "Close",
                angularPermissions: {}
              },
              {
                edit: true,
                view: true,
                scope: "",
                create: true,
                delete: true,
                export: true,
                import: true,
                fullaccess: true,
                moduleName: "Draft",
                angularPermissions: {}
              }
            ]
          },
          {
            "moduleName": "Candidate",
            // "edit": true,
            // "view": true,
            // "create": true,
            // "delete": true,
            // "export": true,
            // "fullaccess": true,
            // "angularPermissions": {}
            children: [
              {
                edit: true,
                view: true,
                scope: "",
                create: true,
                delete: true,
                export: true,
                import: true,
                fullaccess: true,
                moduleName: "Applied",
                angularPermissions: {}
              },
              {
                edit: true,
                view: true,
                scope: "",
                create: true,
                delete: true,
                export: true,
                import: true,
                fullaccess: true,
                moduleName: "Interview",
                angularPermissions: {}
              },
              {
                edit: true,
                view: true,
                scope: "",
                create: true,
                delete: true,
                export: true,
                import: true,
                fullaccess: true,
                moduleName: "Offered",
                angularPermissions: {}
              },
              {
                edit: true,
                view: true,
                scope: "",
                create: true,
                delete: true,
                export: true,
                import: true,
                fullaccess: true,
                moduleName: "Onboarding",
                angularPermissions: {}
              },
              {
                edit: true,
                view: true,
                scope: "",
                create: true,
                delete: true,
                export: true,
                import: true,
                fullaccess: true,
                moduleName: "Rejected",
                angularPermissions: {}
              }
            ]
          }
        ]
      }
    ];


      

        const EmployeePermissionJson = [
          {
            "children": [
              {
                "edit": false,
                "view": false,
                "fullaccess": false,
                "moduleName": "Organization Profile",
                "angularPermissions": {
                  "canUserViewSubscriptionDetails": false
                }
              },
              {
                "edit": false,
                "view": false,
                "create": false,
                "delete": false,
                "export": false,
                "fullaccess": false,
                "moduleName": "Branch & Locations",
                "angularPermissions": {}
              },
              {
                "edit": false,
                "view": false,
                "create": false,
                "delete": false,
                "export": false,
                "fullaccess": false,
                "moduleName": "Department",
                "angularPermissions": {}
              },
              {
                "edit": false,
                "view": false,
                "create": false,
                "delete": false,
                "export": false,
                "fullaccess": false,
                "moduleName": "Designation",
                "angularPermissions": {}
              },
              {
                "edit": false,
                "view": false,
                "create": false,
                "delete": false,
                "export": false,
                "fullaccess": false,
                "moduleName": "Roles & Permissions",
                "angularPermissions": {}
              },
              {
                "edit": false,
                "view": false,
                "create": false,
                "delete": false,
                "fullaccess": false,
                "moduleName": "Setting",
                "angularPermissions": {}
              }
            ],
            "moduleName": "Organisation Profile"
          },
          {
            "children": [
              {
                "view": false,
                "export": false,
                "moduleName": "Dashboard",
                "angularPermissions": {}
              },
              {
                "edit": false,
                "view": true,
                "create": true,
                "delete": false,
                "export": false,
                "import": false,
                "fullaccess": false,
                "moduleName": "Attendance log",
                "angularPermissions": {}
              },
              {
                "edit": false,
                "view": false,
                "create": false,
                "delete": false,
                "export": false,
                "import": false,
                "fullaccess": false,
                "moduleName": "Attendance Records of Others",
                "angularPermissions": {}
              },
              {
                "edit": false,
                "view": false,
                "create": true,
                "delete": false,
                "export": false,
                "import": false,
                "fullaccess": false,
                "moduleName": "Attendance Requests",
                "angularPermissions": {}
              }
            ],
            "moduleName": "Attendance"
          },
          {
            "children": [
              {
                "edit": false,
                "view": false,
                "create": false,
                "delete": false,
                "export": false,
                "fullaccess": false,
                "moduleName": "Offboarding",
                "angularPermissions": {
                  "enableToGiveRegination": false
                }
              }
            ],
            "moduleName": "Offboarding"
          },
          {
            "children": [
              {
                "edit": false,
                "view": false,
                "create": false,
                "delete": false,
                "export": false,
                "fullaccess": false,
                "moduleName": "All Employee",
                "angularPermissions": {
                  "userPasswordReset": false
                }
              },
              {
                "edit": false,
                "view": false,
                "create": false,
                "delete": false,
                "fullaccess": false,
                "moduleName": "Disciplinary Action",
                "angularPermissions": {
                  "giveAccessForCreateActionStage": false
                }
              },
              {
                "edit": false,
                "view": false,
                "create": false,
                "delete": false,
                "export": false,
                "fullaccess": false,
                "moduleName": "Benefits",
                "angularPermissions": {}
              },
              {
                "edit": false,
                "view": false,
                "create": false,
                "delete": false,
                "export": false,
                "fullaccess": false,
                "moduleName": "Assets",
                "angularPermissions": {}
              },
              {
                "edit": false,
                "view": false,
                "create": false,
                "delete": false,
                "export": false,
                "fullaccess": false,
                "moduleName": "External Users",
                "angularPermissions": {}
              },
              {
                "edit": false,
                "view": false,
                "create": false,
                "delete": false,
                "export": false,
                "fullaccess": false,
                "moduleName": "Teams",
                "angularPermissions": {}
              }
            ],
            "moduleName": "Employee Management"
          },
          {
            "children": [
              {
                "edit": false,
                "view": false,
                "create": false,
                "delete": false,
                "fullaccess": false,
                "moduleName": "Recruitment",
                "angularPermissions": {}
              }
            ],
            "moduleName": "Recruitment Management"
          }
        ];
        
        await this.dataSource.query(
          `INSERT INTO ${schemaName}.organization_permissions (role_id, permissions) 
           VALUES 
              ($1, $2::jsonb),
              ($3, $4::jsonb)`,
          [
              1, JSON.stringify(permissionsJsonAdmin),
              2, JSON.stringify(EmployeePermissionJson)
          ]
      );
      
        
        
      
  }
}