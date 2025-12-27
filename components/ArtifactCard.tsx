/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Artifact } from '../types';
import { ThinkingIcon } from './Icons';

interface ArtifactCardProps {
    artifact: Artifact;
    isFocused: boolean;
    onClick: () => void;
}

const ArtifactCard = React.memo(({ 
    artifact, 
    isFocused, 
    onClick 
}: ArtifactCardProps) => {
    const codeRef = useRef<HTMLPreElement>(null);
    // Local state to debounce the HTML updates for smoother rendering
    const [displayHtml, setDisplayHtml] = useState(artifact.html);
    const [isIframeLoaded, setIsIframeLoaded] = useState(false);
    
    // Delays the actual mounting of the iframe into the DOM to allow card animations to finish first
    const [renderDelayComplete, setRenderDelayComplete] = useState(false);
    
    // State for click animation
    const [isClicked, setIsClicked] = useState(false);

    // Update display HTML less frequently to avoid iframe flashing during streaming
    useEffect(() => {
        const timeout = setTimeout(() => {
            setDisplayHtml(artifact.html);
        }, 150); // Small buffer for smoothness
        return () => clearTimeout(timeout);
    }, [artifact.html]);

    // Auto-scroll logic for the code preview
    useEffect(() => {
        if (codeRef.current) {
            codeRef.current.scrollTop = codeRef.current.scrollHeight;
        }
    }, [artifact.html]);

    // Reset states when ID changes
    useEffect(() => {
        setIsIframeLoaded(false);
        setRenderDelayComplete(false);
        
        // Wait for card entrance animation (approx 600ms in CSS) before mounting iframe
        const timer = setTimeout(() => {
            setRenderDelayComplete(true);
        }, 600);
        
        return () => clearTimeout(timer);
    }, [artifact.id]);

    const handleCardClick = (e: React.MouseEvent) => {
        // Trigger the animation
        setIsClicked(true);
        // Remove the class after animation completes to allow re-triggering
        setTimeout(() => setIsClicked(false), 400);
        
        onClick();
    };

    const isBlurring = artifact.status === 'streaming';
    
    // Show iframe only when:
    // 1. The visual animation delay is complete (prevents jank)
    // 2. We have substantial content (> 50 chars)
    const showIframe = renderDelayComplete && displayHtml.length > 50; 

    // Wrap content with basic HTML structure for better responsive rendering if missing
    const wrappedHtml = useMemo(() => {
        if (!displayHtml) return '';
        if (displayHtml.includes('<!DOCTYPE html>') || displayHtml.includes('<html')) return displayHtml;
        
        return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { margin: 0; min-height: 100vh; font-family: system-ui, -apple-system, sans-serif; }
</style>
</head>
<body>
${displayHtml}
</body>
</html>`;
    }, [displayHtml]);

    return (
        <div 
            className={`artifact-card ${isFocused ? 'focused' : ''} ${isBlurring ? 'generating' : ''} ${isClicked ? 'clicked' : ''}`}
            onClick={handleCardClick}
        >
            <div className="artifact-header">
                <span className="artifact-style-tag">{artifact.styleName}</span>
            </div>
            <div className="artifact-card-inner">
                {isBlurring && (
                    <div className="generating-overlay">
                        <div className="generating-loader">
                             <ThinkingIcon />
                             <span className="generating-text">
                                 SOCKET: PŘÍJEM DAT... <span style={{ opacity: 0.5, fontSize: '0.8em' }}>TCP_NODELAY</span>
                             </span>
                        </div>
                        <div className="scanline"></div>
                        <pre ref={codeRef} className="code-stream-preview">
                            {artifact.html.slice(-1000) || '// Inicializuji handshake...'}
                        </pre>
                    </div>
                )}
                
                {showIframe && (
                    <iframe 
                        srcDoc={wrappedHtml} 
                        title={artifact.id} 
                        sandbox="allow-scripts allow-forms allow-modals allow-popups allow-presentation allow-same-origin"
                        className={`artifact-iframe ${(!isBlurring || displayHtml.length > 500) ? 'loaded' : ''}`}
                        onLoad={() => setIsIframeLoaded(true)}
                    />
                )}
            </div>
        </div>
    );
});

export default ArtifactCard;