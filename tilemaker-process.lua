-- Tilemaker processing script
-- Simple configuration for basic map features

-- Process nodes
function node_function(node)
  if node.tags.place then
    node:Layer("places", false)
    node:Attribute("name", node.tags.name or "")
    node:Attribute("place", node.tags.place)
  end
end

-- Process ways  
function way_function(way)
  -- Water features
  if way.tags.natural == "water" or way.tags.waterway or way.tags.landuse == "reservoir" then
    way:Layer("water", true)
    way:Attribute("class", way.tags.natural or way.tags.waterway or "water")
  end
  
  -- Roads and transportation
  if way.tags.highway then
    way:Layer("transportation", false)
    way:Attribute("class", way.tags.highway)
    way:Attribute("name", way.tags.name or "")
  end
  
  -- Buildings
  if way.tags.building then
    way:Layer("buildings", true)
    way:Attribute("type", way.tags.building)
    way:Attribute("name", way.tags.name or "")
  end
end
