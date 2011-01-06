<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:xd="http://www.oxygenxml.com/ns/doc/xsl"
  xmlns:rng="http://relaxng.org/ns/structure/1.0"
  exclude-result-prefixes="xd"
  version="1.0">
  <xsl:output method="text"/>
  <xd:doc scope="stylesheet">
    <xd:desc>
      <xd:p><xd:b>Created on:</xd:b> Jan 4, 2011</xd:p>
      <xd:p><xd:b>Author:</xd:b> hcayless</xd:p>
      <xd:p></xd:p>
    </xd:desc>
  </xd:doc>
  
  <xsl:template match="/">
    <xsl:apply-templates select="//rng:define"/>
  </xsl:template>
  
  <xsl:template match="rng:define">
'<xsl:value-of select="rng:element/rng:name"/>':
    {'elements': [<xsl:for-each select=".//rng:ref"><xsl:sort select="@name"/>'<xsl:value-of select="//rng:define[@name = current()/@name]/rng:element/rng:name"/>'<xsl:if test="position()!=last()">, </xsl:if>
</xsl:for-each>],
    'attributes': [<xsl:for-each select=".//rng:attribute"><xsl:sort select="rng:name"/>'<xsl:value-of select="rng:name"/>'<xsl:if test="position()!=last()">,</xsl:if></xsl:for-each>]}<xsl:if test="following::rng:define">, </xsl:if>
  </xsl:template>
</xsl:stylesheet>