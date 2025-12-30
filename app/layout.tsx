import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Ramadan Checklist",
    description: "Track your daily Ramadan activities and progress",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>{children}</body>
        </html>
    );
}
