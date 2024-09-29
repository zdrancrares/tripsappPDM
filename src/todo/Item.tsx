import React, { memo } from 'react';
import { getLogger } from '../core';
import { ItemProps } from './ItemProps';

const log = getLogger('Item');

const Item: React.FC<ItemProps> = ({ id, text }) => {
  log(`render ${text}`);
  return (
    <div>{text}</div>
  );
};

export default memo(Item);
