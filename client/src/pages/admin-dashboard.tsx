import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertUserSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link } from "wouter";
import { z } from "zod";
import { useFeatureFlags } from "@/hooks/use-feature-flags";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

export default function AdminDashboard() {
    const { user } = useAuth();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof insertUserSchema>>({
        resolver: zodResolver(insertUserSchema),
        defaultValues: {
            username: "",
            password: "",
            role: "user",
        },
    });

    const createUserMutation = useMutation({
        mutationFn: async (values: z.infer<typeof insertUserSchema>) => {
            const res = await apiRequest("POST", "/api/admin/users", values);
            return await res.json();
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "User created successfully",
            });
            form.reset();
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    if (user?.role !== "admin") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card>
                    <CardHeader>
                        <CardTitle>Access Denied</CardTitle>
                        <CardDescription>
                            You do not have permission to view this page.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/">
                            <Button>Return Home</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <Link href="/">
                        <Button variant="outline">Return Home</Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Create New User</CardTitle>
                        <CardDescription>
                            Add a new user to the system.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit((v) => createUserMutation.mutate(v))}
                                className="space-y-4 max-w-md"
                            >
                                <FormField
                                    control={form.control}
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Username</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl>
                                                <Input type="password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="role"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Role</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a role" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="user">User</SelectItem>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    type="submit"
                                    disabled={createUserMutation.isPending}
                                >
                                    {createUserMutation.isPending ? "Creating..." : "Create User"}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                <FeatureFlagsCard />
            </div>
        </div>
    );
}

function FeatureFlagsCard() {
    const { toast } = useToast();
    const { data: flags, isLoading } = useFeatureFlags();

    const updateFlagMutation = useMutation({
        mutationFn: async ({ name, enabled }: { name: string; enabled: boolean }) => {
            const res = await apiRequest("PUT", `/api/admin/feature-flags/${name}`, {
                enabled: enabled ? "true" : "false",
            });
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/feature-flags"] });
            queryClient.invalidateQueries({ queryKey: ["/api/feature-flags"] });
            toast({
                title: "Success",
                description: "Feature flag updated",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const handleToggle = (name: string, currentEnabled: boolean) => {
        updateFlagMutation.mutate({ name, enabled: !currentEnabled });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Feature Flags</CardTitle>
                <CardDescription>
                    Enable or disable features for all users.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : flags && flags.length > 0 ? (
                    <div className="space-y-4">
                        {flags.map((flag) => (
                            <div
                                key={flag.name}
                                className="flex items-center justify-between p-4 border rounded-lg"
                            >
                                <div className="flex-1">
                                    <div className="font-medium">{flag.name}</div>
                                    {flag.description && (
                                        <div className="text-sm text-muted-foreground mt-1">
                                            {flag.description}
                                        </div>
                                    )}
                                </div>
                                <Switch
                                    checked={flag.enabled}
                                    onCheckedChange={() => handleToggle(flag.name, flag.enabled)}
                                    disabled={updateFlagMutation.isPending}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground p-4">
                        No feature flags configured. Create them via the API or database.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
