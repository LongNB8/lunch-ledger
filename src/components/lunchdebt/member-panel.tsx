import type { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
export function MemberPanel({ open, onOpenChange, title, description, children }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description: string; children: ReactNode }) {
 const mobile = useIsMobile();
 if (mobile) return <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false} repositionInputs={false}><DrawerContent className="member-drawer"><div className="member-panel-header"><DrawerTitle>{title}</DrawerTitle><DrawerDescription>{description}</DrawerDescription></div><div className="member-panel-body">{children}</div></DrawerContent></Drawer>;
 return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="member-dialog"><div className="member-panel-header"><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></div><div className="member-panel-body">{children}</div></DialogContent></Dialog>;
}
