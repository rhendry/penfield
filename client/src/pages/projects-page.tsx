import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Project, insertProjectSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ModeToggle } from "@/components/mode-toggle";
import { ChangePasswordDialog } from "@/components/change-password-dialog";

export default function ProjectsPage() {
    const { logoutMutation } = useAuth();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);

    const { data: projects, isLoading } = useQuery<Project[]>({
        queryKey: ["/api/projects"],
    });

    const form = useForm({
        resolver: zodResolver(insertProjectSchema),
        defaultValues: {
            name: "",
            description: "",
        },
    });

    const createProjectMutation = useMutation({
        mutationFn: async (data: { name: string; description?: string }) => {
            const res = await apiRequest("POST", "/api/projects", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
            setOpen(false);
            form.reset();
            toast({
                title: "Project created",
                description: "Your new project has been created successfully.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Failed to create project",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    function onSubmit(values: { name: string; description?: string }) {
        createProjectMutation.mutate(values);
    }

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Projects</h1>
                        <p className="text-muted-foreground">Manage your creative projects</p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <ModeToggle />
                        <ChangePasswordDialog />
                        <Button variant="destructive" onClick={() => logoutMutation.mutate()}>
                            Logout
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                className="h-[200px] flex flex-col gap-4 border-dashed hover:border-primary hover:bg-accent/50 transition-colors"
                            >
                                <Plus className="h-10 w-10" />
                                <span className="text-lg font-medium">Create New Project</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Project</DialogTitle>
                                <DialogDescription>
                                    Give your new project a name and description.
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="My Awesome Project" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="A brief description..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" className="w-full" disabled={createProjectMutation.isPending}>
                                        {createProjectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Create Project
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>

                    {isLoading ? (
                        <div className="col-span-full flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        projects?.map((project) => (
                            <Link key={project.id} href={`/projects/${project.id}`}>
                                <Card className="h-[200px] cursor-pointer hover:border-primary transition-colors flex flex-col">
                                    <CardHeader>
                                        <CardTitle>{project.name}</CardTitle>
                                        <CardDescription className="line-clamp-2">
                                            {project.description || "No description"}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="mt-auto">
                                        <p className="text-xs text-muted-foreground">
                                            Created {new Date(project.createdAt).toLocaleDateString()}
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
