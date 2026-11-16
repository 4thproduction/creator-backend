const PERMISSION_GROUPS = [
  {
    group: "Dashboard",
    permissions: [{ key: "view_dashboard", label: "View Dashboard" }],
  },
  {
    group: "Users",
    permissions: [
      { key: "create_user", label: "Create User" },
      { key: "read_user", label: "Read User" },
      { key: "update_user", label: "Update User" },
      { key: "delete_user", label: "Delete User" },
    ],
  },
  {
    group: "Roles",
    permissions: [
      { key: "create_role", label: "Create Role" },
      { key: "read_role", label: "Read Role" },
      { key: "update_role", label: "Update Role" },
      { key: "delete_role", label: "Delete Role" },
    ],
  },
  {
    group: "Creators",
    permissions: [
      { key: "read_creator", label: "View Creators" },
      { key: "create_creator", label: "Add Creators" },
      { key: "update_creator", label: "Edit Creators" },
      { key: "delete_creator", label: "Delete Creators" },
      { key: "export_creator", label: "Export Creators" },
    ],
  },
];

const PermissionCheckbox = ({ selected, onChange }) => {
  const toggle = (key) => {
    if (selected.includes(key)) {
      onChange(selected.filter((p) => p !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  return (
    <div className="space-y-4">
      {PERMISSION_GROUPS.map(({ group, permissions }) => (
        <div key={group}>
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
            {group}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {permissions.map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-2 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(key)}
                  onChange={() => toggle(key)}
                  className="w-4 h-4 text-blue-600 rounded border-stone-300 focus:ring-amber-500"
                />
                <span className="text-sm text-stone-700">{label}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PermissionCheckbox;
