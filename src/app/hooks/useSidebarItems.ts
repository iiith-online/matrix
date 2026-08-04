import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
import { MatrixClient } from 'matrix-js-sdk';
import { AccountDataEvent } from '../../types/matrix/accountData';
import { useMatrixClient } from './useMatrixClient';
import { getAccountData, isSpace } from '../utils/room';
import { Membership } from '../../types/matrix/room';
import { useAccountDataCallback } from './useAccountDataCallback';

export type ISidebarFolder = {
  name?: string;
  id: string;
  content: string[];
};
export type TSidebarItem = string | ISidebarFolder;
export type SidebarItems = Array<TSidebarItem>;

export type InMatrixIIITSpacesContent = {
  shortcut?: string[];
  sidebar?: SidebarItems;
};

export const parseSidebar = (
  mx: MatrixClient,
  availableSpaces: string[],
  content?: InMatrixIIITSpacesContent
) => {
  const sidebar = content?.sidebar ?? content?.shortcut ?? [];
  const missingSpaces = new Set(availableSpaces);

  const items: SidebarItems = [];

  const safeToAdd = (spaceId: string): boolean => {
    if (typeof spaceId !== 'string') return false;
    const space = mx.getRoom(spaceId);
    if (space?.getMyMembership() !== Membership.Join) return false;
    return isSpace(space);
  };

  sidebar.forEach((item) => {
    if (typeof item === 'string') {
      if (safeToAdd(item) && !items.includes(item)) {
        missingSpaces.delete(item);
        items.push(item);
      }
      return;
    }
    if (
      typeof item === 'object' &&
      typeof item.id === 'string' &&
      Array.isArray(item.content) &&
      !items.find((i) => (typeof i === 'string' ? false : i.id === item.id))
    ) {
      const safeContent = item.content.filter(safeToAdd);
      safeContent.forEach((i) => missingSpaces.delete(i));
      items.push({
        ...item,
        content: Array.from(new Set(safeContent)),
      });
    }
  });

  missingSpaces.forEach((spaceId) => items.push(spaceId));
  return items;
};

export const useSidebarItems = (
  availableSpaces: string[]
): [SidebarItems, Dispatch<SetStateAction<SidebarItems>>] => {
  const mx = useMatrixClient();

  const [sidebarItems, setSidebarItems] = useState(() => {
    const inMatrixIIITSpacesContent = getAccountData(
      mx,
      AccountDataEvent.MatrixIIITSpaces
    )?.getContent<InMatrixIIITSpacesContent>();
    return parseSidebar(mx, availableSpaces, inMatrixIIITSpacesContent);
  });

  useEffect(() => {
    const inMatrixIIITSpacesContent = getAccountData(
      mx,
      AccountDataEvent.MatrixIIITSpaces
    )?.getContent<InMatrixIIITSpacesContent>();
    setSidebarItems(parseSidebar(mx, availableSpaces, inMatrixIIITSpacesContent));
  }, [mx, availableSpaces]);

  useAccountDataCallback(
    mx,
    useCallback(
      (mEvent) => {
        if (mEvent.getType() === AccountDataEvent.MatrixIIITSpaces) {
          const newContent = mEvent.getContent<InMatrixIIITSpacesContent>();
          setSidebarItems(parseSidebar(mx, availableSpaces, newContent));
        }
      },
      [mx, availableSpaces]
    )
  );

  return [sidebarItems, setSidebarItems];
};

export const sidebarItemWithout = (items: SidebarItems, roomId: string) => {
  const newItems: SidebarItems = items
    .map((item) => {
      if (typeof item === 'string') {
        if (item === roomId) return null;
        return item;
      }
      if (item.content.includes(roomId)) {
        const newContent = item.content.filter((id) => id !== roomId);
        if (newContent.length === 0) return null;
        return {
          ...item,
          content: newContent,
        };
      }
      return item;
    })
    .filter((item) => item !== null) as SidebarItems;

  return newItems;
};

export const makeMatrixIIITSpacesContent = (
  mx: MatrixClient,
  items: SidebarItems
): InMatrixIIITSpacesContent => {
  const currentInSpaces =
    getAccountData(mx, AccountDataEvent.MatrixIIITSpaces)?.getContent<InMatrixIIITSpacesContent>() ??
    {};

  const newSpacesContent: InMatrixIIITSpacesContent = {
    ...currentInSpaces,
    sidebar: items,
  };

  return newSpacesContent;
};
