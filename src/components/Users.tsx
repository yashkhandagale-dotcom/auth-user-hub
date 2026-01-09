import { useState, useEffect } from "react";
import { api, auth } from "@/lib/api";

interface User {
  username: string;
  email: string;
  role: string;
}

interface UsersProps {
  onLogout: () => void;
}

const Users = ({ onLogout }: UsersProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      const token = auth.getToken();
      if (!token) {
        onLogout();
        return;
      }

      try {
        const data = await api.getUsers(token);
        setUsers(data);
      } catch (err) {
        if (err instanceof Error && err.message === "Unauthorized") {
          auth.removeToken();
          onLogout();
        } else {
          setError(err instanceof Error ? err.message : "Failed to load users");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [onLogout]);

  const handleLogout = () => {
    auth.removeToken();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-foreground">Users Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:opacity-80 transition-opacity font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {loading && (
          <div className="text-center py-12 text-muted-foreground">
            Loading users...
          </div>
        )}

        {error && (
          <div className="p-4 rounded-md bg-destructive/10 text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                    Username
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                    Role
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user, index) => (
                    <tr key={index} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-foreground">
                        {user.username}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {user.email}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-1 text-xs rounded-full bg-primary/10 text-primary font-medium">
                          {user.role}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default Users;
