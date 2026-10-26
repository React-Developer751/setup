// id ("hero/Hero12") -> the real component from src/components.
// Only the groups that can be a part of a page are loaded with the generator (the others - modals, tables, spinners ... - are for the component library).
import type { ComponentType } from 'react'

const modules = import.meta.glob<{ default: ComponentType }>('../../components/{hero,features,blog,contact,content,cta,footer,gallery,header,navbar,pricing,statics,step,stepper,team,teams,testimonial,faq,portfolio,banner,jumbotron,cookie,speed-dial,carousel,card,video,404-page}/*.tsx', { eager: true })

export const libraryComponents: Record<string, ComponentType> = Object.fromEntries(
  Object.entries(modules).map(([path, mod]) => [path.match(/components\/(.+)\.tsx$/)![1], mod.default]),
)
