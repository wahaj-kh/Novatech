from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session
import models
import schemas
import database
import auth

router = APIRouter(
    tags=["Hero Settings & Spotlight"]
)

@router.get("/settings/hero", response_model=schemas.HeroSettingResponse, summary="Get Hero Settings", description="Retrieves the homepage hero settings and interactive hotspots.")
def get_hero_settings(db: Session = Depends(database.get_db)):
    setting = db.query(models.HeroSetting).first()
    if not setting:
        # Return default if not set
        return {
            "id": 0,
            "title": "Intelligence, built right in.",
            "description": "Hover over the hotspots to discover what makes NovaBook Pro the ultimate tool for creators.",
            "image_url": None,
            "hotspots": []
        }
    return setting

@router.put("/admin/settings/hero", response_model=schemas.HeroSettingResponse, summary="Update Hero Settings", description="Updates the title, description, and image for the hero spotlight. Use the /hotspots endpoints to manage interactive points.")
def update_hero_settings(
    title: str = Form(...),
    description: str = Form(...),
    image_url: str = Form(None),
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.admin_required)
):
    setting = db.query(models.HeroSetting).first()
    
    if not setting:
        setting = models.HeroSetting(
            title=title,
            description=description,
            image_url=image_url
        )
        db.add(setting)
    else:
        setting.title = title
        setting.description = description
        setting.image_url = image_url
        
    db.commit()
    db.refresh(setting)
    return setting

@router.post("/admin/settings/hero/hotspots", response_model=schemas.HeroSettingResponse, summary="Add Hotspot", description="Adds a new interactive hotspot to the hero image.")
def add_hotspot(
    top: str = Form(...),
    left: str = Form(...),
    title: str = Form(...),
    description: str = Form(...),
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.admin_required)
):
    setting = db.query(models.HeroSetting).first()
    if not setting:
        raise HTTPException(status_code=400, detail="Hero settings must be created before adding hotspots.")
        
    hotspot = models.HeroHotspot(
        hero_setting_id=setting.id,
        top=top,
        left=left,
        title=title,
        description=description
    )
    db.add(hotspot)
    db.commit()
    db.refresh(setting)
    return setting

@router.delete("/admin/settings/hero/hotspots/{hotspot_id}", response_model=schemas.HeroSettingResponse, summary="Delete Hotspot", description="Deletes an interactive hotspot from the hero image.")
def delete_hotspot(
    hotspot_id: int,
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.admin_required)
):
    hotspot = db.query(models.HeroHotspot).filter(models.HeroHotspot.id == hotspot_id).first()
    if not hotspot:
        raise HTTPException(status_code=404, detail="Hotspot not found")
        
    setting_id = hotspot.hero_setting_id
    db.delete(hotspot)
    db.commit()
    
    setting = db.query(models.HeroSetting).filter(models.HeroSetting.id == setting_id).first()
    return setting
