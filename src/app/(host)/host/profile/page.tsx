"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Calendar, Shield } from "lucide-react";

interface HostInfo {
  id: string;
  email: string;
  displayName: string | null;
  lastLoginAt: string | null;
}

export default function ProfilePage() {
  const [host, setHost] = useState<HostInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/auth/status", {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }
        const data = await response.json();
        if (data.isAuthenticated && data.host) {
          setHost(data.host);
        } else {
          setError("Not authenticated");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl py-8 px-4">
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">
            Loading profile...
          </div>
        </div>
      </div>
    );
  }

  if (error || !host) {
    return (
      <div className="container mx-auto max-w-2xl py-8 px-4">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">
              {error || "Unable to load profile"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Display Name */}
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Display Name
              </p>
              <p className="text-lg">
                {host.displayName || (
                  <span className="text-muted-foreground italic">Not set</span>
                )}
              </p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-lg">{host.email}</p>
            </div>
          </div>

          {/* Last Login */}
          {host.lastLoginAt && (
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Last Login
                </p>
                <p className="text-lg">
                  {new Date(host.lastLoginAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Authentication Method */}
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Authentication
              </p>
              <Badge variant="secondary" className="mt-1">
                Microsoft Entra ID
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground mt-4 text-center">
        Your account information is managed by Microsoft. To update your profile,
        visit your Microsoft account settings.
      </p>
    </div>
  );
}
