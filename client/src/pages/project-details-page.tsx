import { useQuery, useMutation } from "@tanstack/react-query";
import { Project, Asset, insertAssetSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Loader2, ArrowLeft, Edit } from "lucide-react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function ProjectDetailsPage() {
    const [, params] = useRoute("/projects/:id");
    const id = params?.id;
    const { toast } = useToast();
    const [open, setOpen] = useState(false);

    const { data: project, isLoading: isLoadingProject } = useQuery<Project>({
        queryKey: [`/api/projects/${id}`],
        enabled: !!id,
    });

    const { data: assets, isLoading: isLoadingAssets } = useQuery<Asset[]>({
        queryKey: [`/api/projects/${id}/assets`],
        enabled: !!id,
    });

    const form = useForm({
        resolver: zodResolver(insertAssetSchema.pick({ name: true, type: true })),
        defaultValues: {
            name: "",
            type: "pixel",
            content: {}, // Default empty content
        },
    });

    const createAssetMutation = useMutation({
        mutationFn: async (data: { name: string; type: string; content: object }) => {
            const res = await apiRequest("POST", `/api/projects/${id}/assets`, data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}/assets`] });
            setOpen(false);
            form.reset();
            toast({
                title: "Asset created",
                description: "Your new asset has been created successfully.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Failed to create asset",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    function onSubmit(values: { name: string; type: string }) {
        // Initialize content based on type
        let content: object = {};
        if (values.type === "pixel") {
            content = createDefaultAssetContent();
        }
        createAssetMutation.mutate({ ...values, content });
    }

    if (isLoadingProject || isLoadingAssets) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!project) {
        return <div>Project not found</div>;
    }

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">{project.name}</h1>
                        <p className="text-muted-foreground">{project.description}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                className="h-[150px] flex flex-col gap-4 border-dashed hover:border-primary hover:bg-accent/50 transition-colors"
                            >
                                <Plus className="h-8 w-8" />
                                <span className="text-lg font-medium">Create New Asset</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Asset</DialogTitle>
                                <DialogDescription>
                                    Add a new asset to your project.
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
                                                    <Input placeholder="My Asset" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Type</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a type" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="pixel">Pixel Art</SelectItem>
                                                        <SelectItem value="voxel" disabled>Voxel Art (Coming Soon)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" className="w-full" disabled={createAssetMutation.isPending}>
                                        {createAssetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Create Asset
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>

                    {assets?.map((asset) => (
                        <Link key={asset.id} href={`/assets/${asset.id}/edit`}>
                            <Card className="h-[150px] cursor-pointer hover:border-primary transition-colors flex flex-col justify-between">
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-start">
                                        <span>{asset.name}</span>
                                        <span className="text-xs px-2 py-1 bg-secondary rounded-full font-normal">
                                            {asset.type}
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center text-sm text-muted-foreground gap-2">
                                        <Edit className="h-4 w-4" />
                                        Click to edit
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
