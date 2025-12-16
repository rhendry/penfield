import type { Meta, StoryObj } from "@storybook/react";
import { IconWithBadge, registerLucideIcons } from "../../client/src/components/toolkit/icon-with-badge";
import { Pencil, Eraser } from "lucide-react";

// Register icons for dynamic loading
registerLucideIcons({
    Pencil,
    Eraser,
});

const meta = {
    title: "Toolkit/IconWithBadge",
    component: IconWithBadge,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof IconWithBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LucideIconOnly: Story = {
    args: {
        iconType: "lucide",
        iconName: "Pencil",
        size: 48,
    },
};

export const CustomSvgIcon: Story = {
    args: {
        iconType: "custom",
        iconName: "custom-tool.svg",
        size: 48,
    },
};

export const LucideWithBadge: Story = {
    args: {
        iconType: "lucide",
        iconName: "Pencil",
        badgeType: "lucide",
        badgeName: "Eraser",
        badgeAlignment: "top-right",
        size: 48,
    },
};

export const DifferentBadgeAlignments: Story = {
    render: () => (
        <div className="flex gap-8 items-center">
            <div className="flex flex-col items-center gap-2">
                <IconWithBadge
                    iconType="lucide"
                    iconName="Pencil"
                    badgeType="lucide"
                    badgeName="Eraser"
                    badgeAlignment="top-right"
                    size={48}
                />
                <span className="text-xs text-muted-foreground">top-right</span>
            </div>
            <div className="flex flex-col items-center gap-2">
                <IconWithBadge
                    iconType="lucide"
                    iconName="Pencil"
                    badgeType="lucide"
                    badgeName="Eraser"
                    badgeAlignment="bottom-left"
                    size={48}
                />
                <span className="text-xs text-muted-foreground">bottom-left</span>
            </div>
            <div className="flex flex-col items-center gap-2">
                <IconWithBadge
                    iconType="lucide"
                    iconName="Pencil"
                    badgeType="lucide"
                    badgeName="Eraser"
                    badgeAlignment="center"
                    size={48}
                />
                <span className="text-xs text-muted-foreground">center</span>
            </div>
        </div>
    ),
};

