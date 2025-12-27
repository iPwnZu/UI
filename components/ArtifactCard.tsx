/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useState } from 'react';
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
    
    // State for click animation
    const [isClicked, setIsClicked] = useState(false);

    // Update display HTML less frequently to avoid iframe flashing
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

    // Reset iframe loaded state when ID changes
    useEffect(() => {
        setIsIframeLoaded(false);
    }, [artifact.id]);

    const handleCardClick = (e: React.MouseEvent) => {
        // Trigger the animation
        setIsClicked(true);
        // Remove the class after animation completes to allow re-triggering
        setTimeout(() => setIsClicked(false), 400);
        
        onClick();
    };

    const isBlurring = artifact.status === 'streaming';
    // Show iframe when we have content and aren't purely in "thinking" mode, 
    // but keep overlay until fully complete or substantial content exists
    const showIframe = displayHtml.length > 50; 

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
                        srcDoc={displayHtml} 
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