import { useEffect, useCallback } from 'react';
import { useCanvasContext } from '../context/CanvasContext';
import { useDesignerContext } from '../context/DesignerContext';

export const useCanvasTransform = (
  trRef: React.RefObject<any>,
  layerRef: React.RefObject<any>
) => {
  const { setIsTransforming, setSnapLines } = useCanvasContext();
  const { tempLayout, editSide, updateItem } = useDesignerContext();

  const handleTransformStart = useCallback(() => {
    setIsTransforming(true);
  }, [setIsTransforming]);

  const handleTransform = useCallback((e: any) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Calculate new dimensions and reset scale
    const newWidth = Math.max(10, node.width() * scaleX);
    const newHeight = Math.max(10, node.height() * scaleY);

    node.setAttrs({
      width: newWidth,
      height: newHeight,
      scaleX: 1,
      scaleY: 1
    });

    // Update internal elements
    const textNode = node.findOne('Text');
    const imageNode = node.findOne('Image');
    const shapeNode = node.findOne('.Shape');
    const boundsNode = node.findOne('.Bounds');

    if (textNode) {
      textNode.width(newWidth);
      textNode.height(newHeight);
    }
    if (imageNode) {
      imageNode.width(newWidth);
      imageNode.height(newHeight);
    }
    if (boundsNode) {
      boundsNode.width(newWidth);
      boundsNode.height(newHeight);
    }

    if (shapeNode) {
      if (shapeNode.getClassName() === 'Circle') {
        const radius = newWidth / 2;
        shapeNode.setAttrs({
          radius: radius,
          x: radius,
          y: radius
        });
      } else {
        shapeNode.setAttrs({
          width: newWidth,
          height: newHeight
        });
      }
    }

    layerRef.current?.batchDraw();
  }, [layerRef]);

  const handleTransformEnd = useCallback((e: any) => {
    setIsTransforming(false);
    const node = e.target;
    const nodeName = node.name();
    if (!nodeName) return;

    const textNode = node.findOne('Text');
    const side = editSide.toLowerCase();
    const config = tempLayout[side]?.[nodeName];

    const finalUpdates: any = {
      x: Math.round(node.x()),
      y: Math.round(node.y()),
      width: Math.round(node.width()),
      height: Math.round(node.height()),
      rotation: Math.round(node.rotation()),
    };

    // Update fontSize if text with stretch fit
    if (textNode && config?.fit === 'stretch') {
      finalUpdates.fontSize = Math.round(textNode.fontSize());
    }

    setSnapLines({ vertical: [], horizontal: [] });
    updateItem(nodeName, finalUpdates);
  }, [setIsTransforming, editSide, tempLayout, updateItem, setSnapLines]);

  // Attach transformer event listeners
  useEffect(() => {
    if (!trRef.current) return;

    const transformer = trRef.current;
    transformer.on('transformstart', handleTransformStart);
    transformer.on('transform', handleTransform);
    transformer.on('transformend', handleTransformEnd);

    return () => {
      transformer.off('transformstart', handleTransformStart);
      transformer.off('transform', handleTransform);
      transformer.off('transformend', handleTransformEnd);
    };
  }, [trRef, handleTransformStart, handleTransform, handleTransformEnd]);

  return null;
};