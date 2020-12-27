
export interface AnchorItem {
    name: string;
}

export interface WallItem {

    name?: string;
    height?: string | { left: string; right: string };
    thickness?: string;
    length?: string;
    to?: string;
    from?: string;
    depth?: string;
}
